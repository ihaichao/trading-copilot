import { TrendType } from './trend';
import { Signal } from './signal';

export type Timeframe = 'weekly' | 'daily' | '4h';

export interface TimeframeContext {
  timeframe: Timeframe;
  trend: TrendType;
  ema21: number;
  ema50: number;
  ema200: number;
  rsi: number;
  signals: Signal[];
}

export type TimeframeAlignment = 'aligned' | 'conflicting' | 'neutral';

export interface MultiTimeframeResult {
  weekly: TimeframeContext;
  daily: TimeframeContext;
  fourHour: TimeframeContext;
  alignment: TimeframeAlignment;
  confidenceAdjustment: number; // -1, 0, +1
  summary: string;
}
