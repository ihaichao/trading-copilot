export const STRATEGY_CONFIG = {
  ema: {
    periods: [21, 50, 100, 200] as const,
  },
  rsi: {
    period: 14,
    oversold: 35,
    overbought: 70,
  },
  stochRsi: {
    period: 14,
    oversold: 20,
    overbought: 80,
  },
  breakout: {
    lookback: 20,
    volumeRatio: 1.2,
  },
  pullback: {
    tolerance: 0.01,
    expiryDays: 10,
  },
  stop: {
    buffer: 0.01,
  },
  swingPoint: {
    lookback: 5,
    structureWindow: 60,
  },
  structure: {
    proximityThreshold: 0.05,
  },
  position: {
    timeLimitDays: 10,
    halfTargetThreshold: 0.5,
    addOnEma21Tolerance: 0.02,
  },
  multiTimeframe: {
    weeklyBarCount: 104,
    fourHourBarCount: 200,
  },
} as const;
