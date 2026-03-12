import { describe, it, expect } from 'vitest';
import { classifyTrend } from '../trend';

describe('classifyTrend', () => {
  const bullishSwings = [
    { index: 10, type: 'high' as const, price: 100 },
    { index: 20, type: 'low' as const, price: 90 },
    { index: 30, type: 'high' as const, price: 110 },
    { index: 40, type: 'low' as const, price: 95 },
  ];

  const bearishSwings = [
    { index: 10, type: 'high' as const, price: 110 },
    { index: 20, type: 'low' as const, price: 95 },
    { index: 30, type: 'high' as const, price: 105 },
    { index: 40, type: 'low' as const, price: 90 },
  ];

  it('should return bullish for bullish EMA + bullish structure', () => {
    expect(classifyTrend(200, 190, 180, 170, bullishSwings, 50, 60)).toBe('bullish');
  });

  it('should return bearish for bearish EMA + bearish structure', () => {
    expect(classifyTrend(170, 180, 190, 200, bearishSwings, 50, 60)).toBe('bearish');
  });

  it('should return mild_bullish for partial bullish EMA', () => {
    expect(classifyTrend(200, 190, 195, 185, [], 50, 60)).toBe('mild_bullish');
  });

  it('should return mild_bearish for partial bearish EMA', () => {
    expect(classifyTrend(180, 190, 185, 195, [], 50, 60)).toBe('mild_bearish');
  });

  it('should return ranging when no clear trend', () => {
    expect(classifyTrend(190, 190, 190, 190, [], 50, 60)).toBe('ranging');
  });
});
