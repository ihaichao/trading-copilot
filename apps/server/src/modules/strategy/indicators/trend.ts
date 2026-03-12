import { TrendType } from '@trading-copilot/shared';
import { SwingPoint } from './swing-points';

/**
 * Classify trend based on EMA alignment and price structure.
 *
 * EMA alignment:
 * - Bullish: EMA21 > EMA50 > EMA100 > EMA200
 * - Bearish: EMA21 < EMA50 < EMA100 < EMA200
 *
 * Structure (from swing points in structure window):
 * - Higher highs + higher lows → bullish structure
 * - Lower highs + lower lows → bearish structure
 */
export function classifyTrend(
  ema21: number,
  ema50: number,
  ema100: number,
  ema200: number,
  swingPoints: SwingPoint[],
  totalBars: number,
  structureWindow: number,
): TrendType {
  // EMA alignment
  const emaBullish = ema21 > ema50 && ema50 > ema100 && ema100 > ema200;
  const emaBearish = ema21 < ema50 && ema50 < ema100 && ema100 < ema200;
  const emaPartialBullish = ema21 > ema50;
  const emaPartialBearish = ema21 < ema50;

  // Structure analysis from recent swing points
  const startIdx = Math.max(0, totalBars - structureWindow);
  const recentPoints = swingPoints.filter((p) => p.index >= startIdx);
  const highs = recentPoints.filter((p) => p.type === 'high').map((p) => p.price);
  const lows = recentPoints.filter((p) => p.type === 'low').map((p) => p.price);

  let structureBullish = false;
  let structureBearish = false;

  if (highs.length >= 2 && lows.length >= 2) {
    const hhCount = highs.filter((h, i) => i > 0 && h > highs[i - 1]).length;
    const hlCount = lows.filter((l, i) => i > 0 && l > lows[i - 1]).length;
    const lhCount = highs.filter((h, i) => i > 0 && h < highs[i - 1]).length;
    const llCount = lows.filter((l, i) => i > 0 && l < lows[i - 1]).length;

    structureBullish = hhCount > 0 && hlCount > 0;
    structureBearish = lhCount > 0 && llCount > 0;
  }

  // Combine EMA and structure
  if (emaBullish && structureBullish) return 'bullish';
  if (emaBearish && structureBearish) return 'bearish';
  if (emaPartialBullish || structureBullish) return 'mild_bullish';
  if (emaPartialBearish || structureBearish) return 'mild_bearish';
  return 'ranging';
}
