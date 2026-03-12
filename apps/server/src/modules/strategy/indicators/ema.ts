export function computeEma(closes: number[], period: number): number[] {
  if (closes.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [closes[0]];
  for (let i = 1; i < closes.length; i++) {
    ema.push(closes[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

export function computeAllEmas(
  closes: number[],
  periods: readonly number[],
): Record<number, number[]> {
  const result: Record<number, number[]> = {};
  for (const period of periods) {
    result[period] = computeEma(closes, period);
  }
  return result;
}
