import { computeRsi } from './rsi';

/**
 * Stochastic RSI: normalizes RSI to 0-100 range over a lookback period.
 * StochRSI = (RSI - min(RSI, period)) / (max(RSI, period) - min(RSI, period)) * 100
 */
export function computeStochRsi(
  closes: number[],
  rsiPeriod: number,
  stochPeriod: number,
): number[] {
  const rsiValues = computeRsi(closes, rsiPeriod);
  const stochRsi: number[] = new Array(rsiValues.length).fill(50);

  for (let i = stochPeriod - 1; i < rsiValues.length; i++) {
    const window = rsiValues.slice(i - stochPeriod + 1, i + 1);
    const min = Math.min(...window);
    const max = Math.max(...window);
    stochRsi[i] = max === min ? 50 : ((rsiValues[i] - min) / (max - min)) * 100;
  }

  return stochRsi;
}
