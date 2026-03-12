import { Injectable, Optional } from '@nestjs/common';
import { OhlcvBar, SignalInfo, Signal, Position, STRATEGY_CONFIG } from '@trading-copilot/shared';
import {
  computeAllEmas,
  computeRsi,
  computeStochRsi,
  detectSwingPoints,
  findKeyLevels,
  computeDynamicStop,
  detectBreakouts,
  detectPullbacks,
  classifyTrend,
  checkEntryConditions,
  computeAdvice,
  analyzeTimeframe,
  computeMultiTimeframe,
} from './indicators';
import { AiAdviceService } from '../ai/ai-advice.service';

export interface AnalysisResult {
  bars: OhlcvBar[];
  info: SignalInfo;
}

@Injectable()
export class StrategyService {
  constructor(@Optional() private readonly aiAdvice?: AiAdviceService) {}

  runFullAnalysis(bars: OhlcvBar[], position?: Position | null): AnalysisResult {
    return runFullAnalysis(bars, position ?? null);
  }

  async runMultiTimeframeAnalysis(
    ticker: string,
    dailyBars: OhlcvBar[],
    weeklyBars: OhlcvBar[],
    fourHourBars: OhlcvBar[] | null,
    position?: Position | null,
  ): Promise<AnalysisResult> {
    // 1. Run daily analysis (existing full pipeline)
    const result = runFullAnalysis(dailyBars, position ?? null);

    // 2. Analyze weekly
    if (weeklyBars.length < 20) {
      return result;
    }
    const weeklyContext = analyzeTimeframe(weeklyBars, 'weekly');

    // 3. Build daily context from existing info
    const dailyContext = {
      timeframe: 'daily' as const,
      trend: result.info.trend,
      ema21: result.info.ema21,
      ema50: result.info.ema50,
      ema200: result.info.ema200,
      rsi: result.info.rsi,
      signals: result.info.signals,
    };

    // 4. Analyze 4H (or use a neutral placeholder if unavailable)
    const fourHourContext =
      fourHourBars && fourHourBars.length >= 20
        ? analyzeTimeframe(fourHourBars, '4h')
        : {
            timeframe: '4h' as const,
            trend: 'ranging' as const,
            ema21: 0,
            ema50: 0,
            ema200: 0,
            rsi: 50,
            signals: [],
          };

    // 5. Compute multi-timeframe result
    const mtf = computeMultiTimeframe(weeklyContext, dailyContext, fourHourContext);
    result.info.mtf = mtf;

    // 6. AI advice with rule engine fallback
    if (this.aiAdvice) {
      try {
        result.info.advice = await this.aiAdvice.generateAdvice(
          ticker,
          result.info,
          position ?? null,
        );
      } catch {
        result.info.advice = computeAdvice(result.info, position ?? null);
      }
    } else {
      result.info.advice = computeAdvice(result.info, position ?? null);
    }

    return result;
  }
}

/**
 * Pure function version of the full analysis pipeline.
 * Can be used without NestJS DI.
 */
export function runFullAnalysis(
  bars: OhlcvBar[],
  position: Position | null = null,
): AnalysisResult {
  if (bars.length === 0) {
    throw new Error('No bars provided for analysis');
  }

  const closes = bars.map((b) => b.close);
  const last = bars.length - 1;

  // 1. Compute EMAs
  const emas = computeAllEmas(closes, STRATEGY_CONFIG.ema.periods);
  const ema21 = emas[21];
  const ema50 = emas[50];
  const ema100 = emas[100];
  const ema200 = emas[200];

  // 2. Compute RSI and StochRSI
  const rsiValues = computeRsi(closes, STRATEGY_CONFIG.rsi.period);
  const stochRsiValues = computeStochRsi(
    closes,
    STRATEGY_CONFIG.stochRsi.period,
    STRATEGY_CONFIG.stochRsi.period,
  );

  // 3. Detect swing points and key levels
  const swingPoints = detectSwingPoints(bars, STRATEGY_CONFIG.swingPoint.lookback);
  const { resistance, support } = findKeyLevels(
    bars,
    swingPoints,
    STRATEGY_CONFIG.swingPoint.structureWindow,
  );

  // 4. Classify trend
  const trend = classifyTrend(
    ema21[last],
    ema50[last],
    ema100[last],
    ema200[last],
    swingPoints,
    bars.length,
    STRATEGY_CONFIG.swingPoint.structureWindow,
  );

  // 5. Detect signals
  const signals: Signal[] = [];

  // Breakout signals
  signals.push(...detectBreakouts(bars));

  // Pullback signals
  signals.push(...detectPullbacks(bars, ema21, ema50));

  // Oversold/overbought signals
  const rsi = rsiValues[last];
  const stochRsi = stochRsiValues[last];
  if (rsi < STRATEGY_CONFIG.rsi.oversold && stochRsi < STRATEGY_CONFIG.stochRsi.oversold) {
    signals.push({ type: 'oversold', label: '超卖' });
  }
  if (rsi > STRATEGY_CONFIG.rsi.overbought && stochRsi > STRATEGY_CONFIG.stochRsi.overbought) {
    signals.push({ type: 'overbought', label: '超买' });
  }

  // 6. Dynamic stop loss (swing-point based)
  const close = closes[last];
  const dynamicStop = computeDynamicStop(
    close,
    ema50[last],
    swingPoints,
    bars.length,
    STRATEGY_CONFIG.swingPoint.structureWindow,
  );

  // 7. Entry conditions
  const entryCheck = checkEntryConditions(close, trend, signals, support, resistance);

  // 8. Risk/reward
  const bullishTrend = trend === 'bullish' || trend === 'mild_bullish';
  const riskDistance = bullishTrend
    ? Math.abs((close - dynamicStop.stopLong) / close) * 100
    : Math.abs((dynamicStop.stopShort - close) / close) * 100;

  let rewardDistance: number | null = null;
  let riskRewardRatio: number | null = null;
  if (bullishTrend && resistance) {
    rewardDistance = ((resistance - close) / close) * 100;
    if (riskDistance > 0) riskRewardRatio = rewardDistance / riskDistance;
  } else if (!bullishTrend && support) {
    rewardDistance = ((close - support) / close) * 100;
    if (riskDistance > 0) riskRewardRatio = rewardDistance / riskDistance;
  }

  // Build info (without advice first, advice needs the full info)
  const info: SignalInfo = {
    close,
    trend,
    rsi: Math.round(rsi * 100) / 100,
    stochRsi: Math.round(stochRsi * 100) / 100,
    ema21: Math.round(ema21[last] * 100) / 100,
    ema50: Math.round(ema50[last] * 100) / 100,
    ema100: Math.round(ema100[last] * 100) / 100,
    ema200: Math.round(ema200[last] * 100) / 100,
    signals,
    resistance,
    support,
    stopLong: dynamicStop.stopLong,
    stopShort: dynamicStop.stopShort,
    swingLow: dynamicStop.swingLow,
    swingHigh: dynamicStop.swingHigh,
    ...entryCheck,
    riskDistance: Math.round(riskDistance * 100) / 100,
    rewardDistance: rewardDistance !== null ? Math.round(rewardDistance * 100) / 100 : null,
    riskRewardRatio: riskRewardRatio !== null ? Math.round(riskRewardRatio * 100) / 100 : null,
    // placeholder, will be replaced below
    advice: { action: 'wait', reasons: [] },
  };

  // 9. Compute advice
  info.advice = computeAdvice(info, position);

  return { bars, info };
}
