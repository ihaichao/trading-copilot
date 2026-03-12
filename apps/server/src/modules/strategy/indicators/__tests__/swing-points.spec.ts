import { describe, it, expect } from 'vitest';
import { detectSwingPoints, findKeyLevels } from '../swing-points';
import { OhlcvBar } from '@trading-copilot/shared';

function makeBar(i: number, high: number, low: number): OhlcvBar {
  return {
    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
    open: (high + low) / 2,
    high,
    low,
    close: (high + low) / 2,
    volume: 1000000,
  };
}

describe('detectSwingPoints', () => {
  it('should return empty for insufficient bars', () => {
    const bars = [makeBar(0, 10, 5)];
    expect(detectSwingPoints(bars, 5)).toEqual([]);
  });

  it('should detect a clear swing high', () => {
    // Create V-shape: prices go up then down
    const bars: OhlcvBar[] = [];
    for (let i = 0; i < 11; i++) {
      const peak = 5;
      const dist = Math.abs(i - peak);
      bars.push(makeBar(i, 100 + (5 - dist) * 10, 90 + (5 - dist) * 10));
    }
    const points = detectSwingPoints(bars, 5);
    const highs = points.filter((p) => p.type === 'high');
    expect(highs.length).toBe(1);
    expect(highs[0].index).toBe(5);
  });

  it('should detect a clear swing low', () => {
    // Create inverted V-shape: prices go down then up
    const bars: OhlcvBar[] = [];
    for (let i = 0; i < 11; i++) {
      const trough = 5;
      const dist = Math.abs(i - trough);
      bars.push(makeBar(i, 110 - (5 - dist) * 10, 100 - (5 - dist) * 10));
    }
    const points = detectSwingPoints(bars, 5);
    const lows = points.filter((p) => p.type === 'low');
    expect(lows.length).toBe(1);
    expect(lows[0].index).toBe(5);
  });
});

describe('findKeyLevels', () => {
  it('should return null when no swing points exist', () => {
    const bars = Array.from({ length: 20 }, (_, i) => makeBar(i, 100, 90));
    const { resistance, support } = findKeyLevels(bars, [], 60);
    expect(resistance).toBeNull();
    expect(support).toBeNull();
  });
});
