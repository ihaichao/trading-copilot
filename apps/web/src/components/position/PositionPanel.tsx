import type { Position } from '@trading-copilot/shared';

interface Props {
  position: Position;
  currentPrice: number;
  onClose: () => void;
}

export function PositionPanel({ position, currentPrice, onClose }: Props) {
  const isLong = position.direction === 'long';
  const pnl = isLong
    ? (currentPrice - position.entryPrice) * position.quantity
    : (position.entryPrice - currentPrice) * position.quantity;
  const pnlPct = isLong
    ? ((currentPrice - position.entryPrice) / position.entryPrice) * 100
    : ((position.entryPrice - currentPrice) / position.entryPrice) * 100;
  const inProfit = pnl >= 0;

  return (
    <div className="rounded border border-border-subtle bg-bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
              isLong ? 'bg-bull/15 text-bull' : 'bg-bear/15 text-bear'
            }`}
          >
            {isLong ? 'LONG' : 'SHORT'}
          </span>
          <span className="font-mono text-xs text-text-primary">
            {position.quantity} 股 @ {position.entryPrice.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* P&L */}
          <div className="text-right">
            <div
              className={`font-mono text-sm font-bold tabular-nums ${
                inProfit ? 'text-bull' : 'text-bear'
              }`}
            >
              {inProfit ? '+' : ''}
              {pnl.toFixed(2)}
            </div>
            <div
              className={`font-mono text-[10px] tabular-nums ${
                inProfit ? 'text-bull/70' : 'text-bear/70'
              }`}
            >
              {inProfit ? '+' : ''}
              {pnlPct.toFixed(1)}%
            </div>
          </div>

          {/* Days held */}
          {position.tradingDaysHeld != null && (
            <div className="text-right">
              <div className="font-mono text-xs tabular-nums text-text-primary">
                {position.tradingDaysHeld}天
              </div>
              <div className="font-mono text-[10px] text-text-muted">持有</div>
            </div>
          )}

          <button
            onClick={onClose}
            className="rounded border border-bear/20 bg-bear/5 px-2.5 py-1 font-mono text-[10px] font-bold text-bear transition-colors hover:bg-bear/15"
          >
            平仓
          </button>
        </div>
      </div>

      {/* Stop & target info */}
      <div className="mt-2 flex gap-4 font-mono text-[10px] text-text-muted">
        <span>止损 {position.stopLossAtEntry.toFixed(2)}</span>
        {position.targetAtEntry != null && <span>目标 {position.targetAtEntry.toFixed(2)}</span>}
      </div>
    </div>
  );
}
