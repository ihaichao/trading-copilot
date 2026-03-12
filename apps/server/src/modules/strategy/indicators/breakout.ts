import { OhlcvBar, Signal } from '@trading-copilot/shared';
import { STRATEGY_CONFIG } from '@trading-copilot/shared';

/**
 * Detect breakout signals (breakout_up / breakout_down).
 *
 * Breakout up: today's close > 20-day high AND yesterday's close <= yesterday's 20-day high,
 *              with volume confirmation.
 * Breakout down: today's close < 20-day low AND yesterday's close >= yesterday's 20-day low,
 *                with volume confirmation.
 */
export function detectBreakouts(bars: OhlcvBar[]): Signal[] {
  const { lookback, volumeRatio } = STRATEGY_CONFIG.breakout;
  const signals: Signal[] = [];

  if (bars.length < lookback + 2) return signals;

  const last = bars.length - 1;
  const prev = last - 1;

  // Calculate 20-day high/low for today (excluding today)
  const recentBarsToday = bars.slice(last - lookback, last);
  const high20Today = Math.max(...recentBarsToday.map((b) => b.high));
  const low20Today = Math.min(...recentBarsToday.map((b) => b.low));

  // Calculate 20-day high/low for yesterday (excluding yesterday)
  const recentBarsYesterday = bars.slice(prev - lookback, prev);
  const high20Yesterday = Math.max(...recentBarsYesterday.map((b) => b.high));
  const low20Yesterday = Math.min(...recentBarsYesterday.map((b) => b.low));

  // 20-day average volume
  const avgVolume =
    bars.slice(last - lookback, last).reduce((sum, b) => sum + b.volume, 0) / lookback;
  const volumeConfirmed = bars[last].volume / avgVolume > volumeRatio;

  // Breakout up
  if (bars[last].close > high20Today && bars[prev].close <= high20Yesterday && volumeConfirmed) {
    signals.push({ type: 'breakout_up', label: '向上突破' });
  }

  // Breakout down
  if (bars[last].close < low20Today && bars[prev].close >= low20Yesterday && volumeConfirmed) {
    signals.push({ type: 'breakout_down', label: '向下跌破' });
  }

  return signals;
}

/**
 * Check if a recent breakout occurred (within expiryDays) for pullback detection.
 * Returns the index of the breakout bar, or -1 if none found.
 */
export function findRecentBreakout(bars: OhlcvBar[], direction: 'up' | 'down'): number {
  const { lookback, volumeRatio } = STRATEGY_CONFIG.breakout;
  const { expiryDays } = STRATEGY_CONFIG.pullback;
  const last = bars.length - 1;
  const searchStart = Math.max(lookback + 1, last - expiryDays);

  for (let i = last - 1; i >= searchStart; i--) {
    const prev = i - 1;
    if (prev < lookback) continue;

    const recentBarsI = bars.slice(i - lookback, i);
    const recentBarsPrev = bars.slice(prev - lookback, prev);
    const avgVol = recentBarsI.reduce((s, b) => s + b.volume, 0) / lookback;
    const volOk = bars[i].volume / avgVol > volumeRatio;

    if (direction === 'up') {
      const high20I = Math.max(...recentBarsI.map((b) => b.high));
      const high20Prev = Math.max(...recentBarsPrev.map((b) => b.high));
      if (bars[i].close > high20I && bars[prev].close <= high20Prev && volOk) return i;
    } else {
      const low20I = Math.min(...recentBarsI.map((b) => b.low));
      const low20Prev = Math.min(...recentBarsPrev.map((b) => b.low));
      if (bars[i].close < low20I && bars[prev].close >= low20Prev && volOk) return i;
    }
  }

  return -1;
}
