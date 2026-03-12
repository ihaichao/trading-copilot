import { OhlcvBar, Signal } from '@trading-copilot/shared';
import { STRATEGY_CONFIG } from '@trading-copilot/shared';
import { findRecentBreakout } from './breakout';

/**
 * Detect pullback signals:
 * - pullback_long: breakout up happened recently, price pulled back to EMA21, closed above it
 * - bounce_short: breakout down happened recently, price bounced to EMA21, closed below it
 */
export function detectPullbacks(bars: OhlcvBar[], ema21: number[], ema50: number[]): Signal[] {
  const signals: Signal[] = [];
  const { tolerance } = STRATEGY_CONFIG.pullback;
  const { lookback } = STRATEGY_CONFIG.breakout;
  const last = bars.length - 1;

  if (bars.length < lookback + 2) return signals;

  // 20-day average volume for shrinkage check
  const avgVolume = bars.slice(last - lookback, last).reduce((s, b) => s + b.volume, 0) / lookback;
  const volumeShrunk = bars[last].volume / avgVolume <= 1.0;

  // Pullback long: breakout up + pullback to EMA21 + close above EMA21 + EMA21 > EMA50
  if (ema21[last] > ema50[last]) {
    const breakoutIdx = findRecentBreakout(bars, 'up');
    if (breakoutIdx >= 0) {
      const nearEma21 = bars[last].low <= ema21[last] * (1 + tolerance);
      const closedAbove = bars[last].close > ema21[last];
      if (nearEma21 && closedAbove && volumeShrunk) {
        signals.push({ type: 'pullback_long', label: '突破回踩做多' });
      }
    }
  }

  // Bounce short: breakout down + bounce to EMA21 + close below EMA21 + EMA21 < EMA50
  if (ema21[last] < ema50[last]) {
    const breakoutIdx = findRecentBreakout(bars, 'down');
    if (breakoutIdx >= 0) {
      const nearEma21 = bars[last].high >= ema21[last] * (1 - tolerance);
      const closedBelow = bars[last].close < ema21[last];
      if (nearEma21 && closedBelow && volumeShrunk) {
        signals.push({ type: 'bounce_short', label: '跌破反弹做空' });
      }
    }
  }

  return signals;
}
