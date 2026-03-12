import { describe, it, expect } from 'vitest';
import { computeRsi } from '../rsi';

describe('computeRsi', () => {
  it('should return 50 for insufficient data', () => {
    expect(computeRsi([100], 14)).toEqual([50]);
  });

  it('should return values in [0, 100] range', () => {
    const closes = Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i / 5) * 20);
    const rsi = computeRsi(closes, 14);
    rsi.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    });
  });

  it('should return 100 for consistently rising prices', () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const rsi = computeRsi(closes, 14);
    // After enough bars, RSI should be 100 for purely rising prices
    expect(rsi[rsi.length - 1]).toBe(100);
  });

  it('should return near 0 for consistently falling prices', () => {
    const closes = Array.from({ length: 30 }, (_, i) => 200 - i);
    const rsi = computeRsi(closes, 14);
    expect(rsi[rsi.length - 1]).toBeLessThan(5);
  });

  it('should return around 50 for oscillating prices', () => {
    const closes: number[] = [];
    for (let i = 0; i < 100; i++) {
      closes.push(i % 2 === 0 ? 100 : 101);
    }
    const rsi = computeRsi(closes, 14);
    const lastRsi = rsi[rsi.length - 1];
    expect(lastRsi).toBeGreaterThan(30);
    expect(lastRsi).toBeLessThan(70);
  });
});
