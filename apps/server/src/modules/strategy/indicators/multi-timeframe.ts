import {
  OhlcvBar,
  Signal,
  Timeframe,
  TimeframeContext,
  TimeframeAlignment,
  MultiTimeframeResult,
  STRATEGY_CONFIG,
  TrendType,
} from '@trading-copilot/shared';
import { computeAllEmas } from './ema';
import { computeRsi } from './rsi';
import { detectSwingPoints } from './swing-points';
import { classifyTrend } from './trend';
import { detectBreakouts } from './breakout';
import { detectPullbacks } from './pullback';

/**
 * Analyze a single timeframe's bars and produce a TimeframeContext.
 * Reuses existing indicator functions.
 */
export function analyzeTimeframe(bars: OhlcvBar[], timeframe: Timeframe): TimeframeContext {
  const closes = bars.map((b) => b.close);
  const last = bars.length - 1;

  const emas = computeAllEmas(closes, STRATEGY_CONFIG.ema.periods);
  const ema21 = emas[21];
  const ema50 = emas[50];
  const ema200 = emas[200];

  const rsiValues = computeRsi(closes, STRATEGY_CONFIG.rsi.period);
  const rsi = rsiValues[last];

  const swingPoints = detectSwingPoints(bars, STRATEGY_CONFIG.swingPoint.lookback);

  const trend = classifyTrend(
    ema21[last],
    ema50[last],
    emas[100][last],
    ema200[last],
    swingPoints,
    bars.length,
    STRATEGY_CONFIG.swingPoint.structureWindow,
  );

  // Detect signals
  const signals: Signal[] = [];
  signals.push(...detectBreakouts(bars));
  signals.push(...detectPullbacks(bars, ema21, ema50));

  if (rsi < STRATEGY_CONFIG.rsi.oversold) {
    signals.push({ type: 'oversold', label: '超卖' });
  }
  if (rsi > STRATEGY_CONFIG.rsi.overbought) {
    signals.push({ type: 'overbought', label: '超买' });
  }

  return {
    timeframe,
    trend,
    ema21: Math.round(ema21[last] * 100) / 100,
    ema50: Math.round(ema50[last] * 100) / 100,
    ema200: Math.round(ema200[last] * 100) / 100,
    rsi: Math.round(rsi * 100) / 100,
    signals,
  };
}

/**
 * Determine if a trend leans bullish.
 */
function isBullish(trend: TrendType): boolean {
  return trend === 'bullish' || trend === 'mild_bullish';
}

/**
 * Determine if a trend leans bearish.
 */
function isBearish(trend: TrendType): boolean {
  return trend === 'bearish' || trend === 'mild_bearish';
}

/**
 * Compute multi-timeframe alignment and generate a human-readable summary.
 */
export function computeMultiTimeframe(
  weekly: TimeframeContext,
  daily: TimeframeContext,
  fourHour: TimeframeContext,
): MultiTimeframeResult {
  // Alignment logic
  const weeklyBull = isBullish(weekly.trend);
  const weeklyBear = isBearish(weekly.trend);
  const dailyBull = isBullish(daily.trend);
  const dailyBear = isBearish(daily.trend);
  const fourHourBull = isBullish(fourHour.trend);
  const fourHourBear = isBearish(fourHour.trend);

  let alignment: TimeframeAlignment;
  let confidenceAdjustment: number;

  // Aligned: all three timeframes agree on direction
  if ((weeklyBull && dailyBull && fourHourBull) || (weeklyBear && dailyBear && fourHourBear)) {
    alignment = 'aligned';
    confidenceAdjustment = 1;
  }
  // Conflicting: weekly and daily disagree
  else if ((weeklyBull && dailyBear) || (weeklyBear && dailyBull)) {
    alignment = 'conflicting';
    confidenceAdjustment = -1;
  }
  // Neutral: anything else
  else {
    alignment = 'neutral';
    confidenceAdjustment = 0;
  }

  // Generate summary
  const summary = generateSummary(weekly, daily, fourHour, alignment);

  return {
    weekly,
    daily,
    fourHour,
    alignment,
    confidenceAdjustment,
    summary,
  };
}

const TREND_LABELS: Record<TrendType, string> = {
  bullish: '多头',
  mild_bullish: '偏多',
  ranging: '震荡',
  mild_bearish: '偏空',
  bearish: '空头',
};

function generateSummary(
  weekly: TimeframeContext,
  daily: TimeframeContext,
  fourHour: TimeframeContext,
  alignment: TimeframeAlignment,
): string {
  const wLabel = TREND_LABELS[weekly.trend];
  const dLabel = TREND_LABELS[daily.trend];
  const fhLabel = TREND_LABELS[fourHour.trend];

  const base = `周线${wLabel} + 日线${dLabel} + 4H${fhLabel}`;

  if (alignment === 'aligned') {
    const direction = isBullish(weekly.trend) ? '多' : '空';
    return `${base} → 多周期共振看${direction}，信号可信度高`;
  }

  if (alignment === 'conflicting') {
    if (isBearish(weekly.trend) && isBullish(daily.trend)) {
      return `${base} → 日线做多信号逆周线大趋势，谨慎操作`;
    }
    if (isBullish(weekly.trend) && isBearish(daily.trend)) {
      return `${base} → 日线做空信号逆周线大趋势，谨慎操作`;
    }
    return `${base} → 周线与日线方向冲突，信号可信度降低`;
  }

  // neutral
  const hasPullback = fourHour.signals.some((s) => s.type === 'pullback_long');
  if (isBullish(weekly.trend) && isBullish(daily.trend) && hasPullback) {
    return `${base} → 大周期偏多，4H回踩信号出现`;
  }

  return `${base} → 周期信号不完全一致，建议等待确认`;
}
