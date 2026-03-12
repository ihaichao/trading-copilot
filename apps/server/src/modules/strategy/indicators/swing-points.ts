import { OhlcvBar, STRATEGY_CONFIG } from '@trading-copilot/shared';

export interface SwingPoint {
  index: number;
  type: 'high' | 'low';
  price: number;
}

/**
 * Detect swing highs and lows.
 * A swing high at index i means bar[i].high is the highest high
 * in the window [i - lookback, i + lookback].
 * A swing low at index i means bar[i].low is the lowest low
 * in the same window.
 */
export function detectSwingPoints(bars: OhlcvBar[], lookback: number): SwingPoint[] {
  const points: SwingPoint[] = [];
  if (bars.length < lookback * 2 + 1) return points;

  for (let i = lookback; i < bars.length - lookback; i++) {
    let isSwingHigh = true;
    let isSwingLow = true;

    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      if (bars[j].high >= bars[i].high) isSwingHigh = false;
      if (bars[j].low <= bars[i].low) isSwingLow = false;
    }

    if (isSwingHigh) points.push({ index: i, type: 'high', price: bars[i].high });
    if (isSwingLow) points.push({ index: i, type: 'low', price: bars[i].low });
  }

  return points;
}

/**
 * Find the most recent resistance (swing high) and support (swing low)
 * from detected swing points within a structure window.
 */
export function findKeyLevels(
  bars: OhlcvBar[],
  swingPoints: SwingPoint[],
  structureWindow: number,
): { resistance: number | null; support: number | null } {
  const startIdx = Math.max(0, bars.length - structureWindow);
  const recentPoints = swingPoints.filter((p) => p.index >= startIdx);

  const highs = recentPoints.filter((p) => p.type === 'high');
  const lows = recentPoints.filter((p) => p.type === 'low');

  const resistance = highs.length > 0 ? highs[highs.length - 1].price : null;
  const support = lows.length > 0 ? lows[lows.length - 1].price : null;

  return { resistance, support };
}

export interface DynamicStopResult {
  stopLong: number;
  stopShort: number;
  swingLow: number | null;
  swingHigh: number | null;
}

/**
 * Compute dynamic stop loss based on swing points.
 *
 * Long stop: nearest swing low below price × 0.99, take higher of swing-based and EMA50-based (tighter).
 * Short stop: nearest swing high above price × 1.01, take lower of swing-based and EMA50-based (tighter).
 */
export function computeDynamicStop(
  close: number,
  ema50: number,
  swingPoints: SwingPoint[],
  barsLength: number,
  structureWindow: number,
): DynamicStopResult {
  const { buffer } = STRATEGY_CONFIG.stop;
  const startIdx = Math.max(0, barsLength - structureWindow);
  const recentPoints = swingPoints.filter((p) => p.index >= startIdx);

  // Find nearest swing low below price
  const swingLows = recentPoints
    .filter((p) => p.type === 'low' && p.price < close)
    .sort((a, b) => b.price - a.price); // highest first (nearest to price)
  const swingLow = swingLows.length > 0 ? swingLows[0].price : null;

  // Find nearest swing high above price
  const swingHighs = recentPoints
    .filter((p) => p.type === 'high' && p.price > close)
    .sort((a, b) => a.price - b.price); // lowest first (nearest to price)
  const swingHigh = swingHighs.length > 0 ? swingHighs[0].price : null;

  // Long stop: swing low × 0.99 vs EMA50 × (1 - buffer), take higher (tighter)
  // Must be below current price to be valid
  const emaStopLong = ema50 * (1 - buffer);
  const swingStopLong = swingLow !== null ? swingLow * (1 - buffer) : null;
  const fallbackStopLong = close * (1 - buffer);
  const candidatesLong = [swingStopLong, emaStopLong].filter(
    (v): v is number => v !== null && v < close,
  );
  const stopLong = candidatesLong.length > 0 ? Math.max(...candidatesLong) : fallbackStopLong;

  // Short stop: swing high × 1.01 vs EMA50 × (1 + buffer), take lower (tighter)
  // Must be above current price to be valid
  const emaStopShort = ema50 * (1 + buffer);
  const swingStopShort = swingHigh !== null ? swingHigh * (1 + buffer) : null;
  const fallbackStopShort = close * (1 + buffer);
  const candidatesShort = [swingStopShort, emaStopShort].filter(
    (v): v is number => v !== null && v > close,
  );
  const stopShort = candidatesShort.length > 0 ? Math.min(...candidatesShort) : fallbackStopShort;

  return {
    stopLong: Math.round(stopLong * 100) / 100,
    stopShort: Math.round(stopShort * 100) / 100,
    swingLow,
    swingHigh,
  };
}
