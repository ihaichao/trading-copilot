import { describe, it, expect } from 'vitest';
import { computeEma, computeAllEmas } from '../ema';

describe('computeEma', () => {
  it('should return empty array for empty input', () => {
    expect(computeEma([], 10)).toEqual([]);
  });

  it('should return single value for single input', () => {
    expect(computeEma([100], 10)).toEqual([100]);
  });

  it('should compute EMA correctly for known values', () => {
    const closes = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const ema = computeEma(closes, 5);
    // EMA(5) multiplier = 2/(5+1) = 0.3333
    expect(ema).toHaveLength(11);
    expect(ema[0]).toBe(10);
    // Each subsequent value: close * k + prev_ema * (1-k)
    const k = 2 / 6;
    expect(ema[1]).toBeCloseTo(11 * k + 10 * (1 - k), 5);
  });

  it('should converge toward price when price is constant', () => {
    const closes = Array(50).fill(100);
    const ema = computeEma(closes, 21);
    expect(ema[49]).toBeCloseTo(100, 5);
  });

  it('should lag behind trending prices', () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const ema = computeEma(closes, 10);
    // EMA should be below the current price in an uptrend
    expect(ema[29]).toBeLessThan(closes[29]);
    expect(ema[29]).toBeGreaterThan(closes[0]);
  });
});

describe('computeAllEmas', () => {
  it('should compute EMAs for all periods', () => {
    const closes = Array.from({ length: 250 }, (_, i) => 100 + Math.sin(i / 10) * 10);
    const result = computeAllEmas(closes, [21, 50, 100, 200]);
    expect(Object.keys(result)).toEqual(['21', '50', '100', '200']);
    expect(result[21]).toHaveLength(250);
    expect(result[200]).toHaveLength(250);
  });
});
