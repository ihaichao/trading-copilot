import { Signal, TrendType, STRATEGY_CONFIG } from '@trading-copilot/shared';

interface EntryCheckResult {
  checkStructure: boolean;
  checkSignal: boolean;
  allChecksPassed: boolean;
}

/**
 * Check the two entry conditions:
 * 1. Structure: price is within proximity of support (long) or resistance (short)
 * 2. Signal: an active entry signal exists
 */
export function checkEntryConditions(
  close: number,
  trend: TrendType,
  signals: Signal[],
  support: number | null,
  resistance: number | null,
): EntryCheckResult {
  const { proximityThreshold } = STRATEGY_CONFIG.structure;
  const bullishTrend = trend === 'bullish' || trend === 'mild_bullish';
  const bearishTrend = trend === 'bearish' || trend === 'mild_bearish';

  // Structure check: price within proximity of support (bullish) or resistance (bearish)
  let checkStructure = false;
  if (bullishTrend && support !== null) {
    checkStructure = Math.abs(close - support) / close <= proximityThreshold;
  } else if (bearishTrend && resistance !== null) {
    checkStructure = Math.abs(resistance - close) / close <= proximityThreshold;
  }
  // Also pass if trend is clear and no key level to compare
  if ((bullishTrend && support === null) || (bearishTrend && resistance === null)) {
    checkStructure = bullishTrend || bearishTrend;
  }

  // Signal check: has an active entry signal
  const entrySignalTypes = ['pullback_long', 'bounce_short', 'oversold', 'overbought'];
  const checkSignal = signals.some((s) => entrySignalTypes.includes(s.type));

  return {
    checkStructure,
    checkSignal,
    allChecksPassed: checkStructure && checkSignal,
  };
}
