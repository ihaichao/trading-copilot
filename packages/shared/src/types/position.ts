export type PositionDirection = 'long' | 'short';

export interface Position {
  id: number;
  ticker: string;
  direction: PositionDirection;
  entryPrice: number;
  quantity: number;
  entryDate: string;
  stopLossAtEntry: number;
  targetAtEntry: number | null;
  tradingDaysHeld?: number;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePositionDto {
  ticker: string;
  direction: PositionDirection;
  entryPrice: number;
  quantity: number;
  entryDate: string;
  stopLossAtEntry: number;
  targetAtEntry?: number | null;
}

export interface UpdatePositionDto {
  quantity?: number;
  isOpen?: boolean;
}
