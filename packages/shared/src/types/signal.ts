import { TrendType } from './trend';
import { MultiTimeframeResult } from './timeframe';

export type SignalType =
  | 'pullback_long'
  | 'bounce_short'
  | 'oversold'
  | 'overbought'
  | 'breakout_up'
  | 'breakout_down';

export interface Signal {
  type: SignalType;
  label: string;
}

export type AdviceAction = 'long' | 'short' | 'wait' | 'hold' | 'close' | 'reduce' | 'add';

export interface AdvicePlan {
  entry?: number;
  stop: number;
  target?: number;
  riskReward?: number;
}

export interface Advice {
  action: AdviceAction;
  reasons: string[];
  plan?: AdvicePlan;
  source?: 'ai' | 'rule';
}

export interface SignalInfo {
  close: number;
  trend: TrendType;
  rsi: number;
  stochRsi: number;
  ema21: number;
  ema50: number;
  ema100: number;
  ema200: number;

  signals: Signal[];

  resistance: number | null;
  support: number | null;
  stopLong: number;
  stopShort: number;

  swingLow: number | null;
  swingHigh: number | null;

  checkStructure: boolean;
  checkSignal: boolean;
  allChecksPassed: boolean;

  riskDistance: number;
  rewardDistance: number | null;
  riskRewardRatio: number | null;

  advice: Advice;

  mtf?: MultiTimeframeResult;
}

export interface ScanResult {
  ticker: string;
  close: number;
  changePercent: number;
  trend: TrendType;
  signals: Signal[];
  rsi: number;
}
