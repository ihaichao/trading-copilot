/**
 * RSI calculation using EMA smoothing (matches TradingView default).
 * Uses Wilder's smoothing: alpha = 1/period (equivalent to EMA with period = 2*period - 1).
 */
export function computeRsi(closes: number[], period: number): number[] {
  if (closes.length < 2) return closes.map(() => 50);

  const rsi: number[] = new Array(closes.length).fill(50);

  // Calculate price changes
  const deltas: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    deltas.push(closes[i] - closes[i - 1]);
  }

  // Initial average gain/loss using SMA for first `period` values
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < Math.min(period, deltas.length); i++) {
    if (deltas[i] > 0) avgGain += deltas[i];
    else avgLoss += Math.abs(deltas[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  // First RSI value
  if (period < deltas.length) {
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
  }

  // Subsequent values using Wilder's smoothing
  for (let i = period; i < deltas.length; i++) {
    const gain = deltas[i] > 0 ? deltas[i] : 0;
    const loss = deltas[i] < 0 ? Math.abs(deltas[i]) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[i + 1] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
  }

  return rsi;
}
