import type { ScanResult } from '@trading-copilot/shared';
import { TrendBadge } from '../common/TrendBadge';
import { SignalBadge } from '../common/SignalBadge';
import { memo, useRef, useState, useCallback, useEffect } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';

interface Props {
  result: ScanResult;
  selected: boolean;
  onSelect: (ticker: string) => void;
  onRemove?: (ticker: string) => void;
  index: number;
}

const LONG_PRESS_MS = 500;

const TrashIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

export const ScannerRow = memo(function ScannerRow({
  result,
  selected,
  onSelect,
  onRemove,
  index,
}: Props) {
  const isUp = result.changePercent >= 0;
  const [showDelete, setShowDelete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(() => {
    if (!onRemove) return;
    movedRef.current = false;
    timerRef.current = setTimeout(() => {
      setShowDelete(true);
      timerRef.current = null;
    }, LONG_PRESS_MS);
  }, [onRemove]);

  const handleTouchMove = useCallback(() => {
    movedRef.current = true;
    clearTimer();
  }, [clearTimer]);

  const handleTouchEnd = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  // Click outside to dismiss
  useEffect(() => {
    if (!showDelete) return;
    const dismiss = () => setShowDelete(false);
    document.addEventListener('touchstart', dismiss, { once: true });
    document.addEventListener('click', dismiss, { once: true });
    return () => {
      document.removeEventListener('touchstart', dismiss);
      document.removeEventListener('click', dismiss);
    };
  }, [showDelete]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowDelete(false);
      onRemove?.(result.ticker);
    },
    [onRemove, result.ticker],
  );

  const handleClick = useCallback(() => {
    if (showDelete) return;
    onSelect(result.ticker);
  }, [showDelete, onSelect, result.ticker]);

  return (
    <TableRow
      className={`animate-fade-in cursor-pointer ${selected ? 'bg-cyan/5' : ''}`}
      style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'backwards' }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <TableCell>
        <span
          className={`font-mono text-xs font-semibold tracking-wider ${selected ? 'text-cyan' : 'text-text-primary'}`}
        >
          {result.ticker}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <span className="font-mono text-xs text-text-primary tabular-nums">
          {result.close.toFixed(2)}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <span className={`font-mono text-xs tabular-nums ${isUp ? 'text-bull' : 'text-bear'}`}>
          {isUp ? '+' : ''}
          {result.changePercent.toFixed(2)}%
        </span>
      </TableCell>
      <TableCell>
        <TrendBadge trend={result.trend} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {result.signals.map((s, i) => (
            <SignalBadge key={i} signal={s} />
          ))}
          {result.signals.length === 0 && (
            <span className="font-mono text-[10px] text-text-muted">—</span>
          )}
        </div>
      </TableCell>
      {onRemove && (
        <TableCell className="w-0 p-0">
          {/* Mobile: long-press reveals */}
          <button
            onClick={handleRemove}
            className={`h-11 items-center justify-center bg-bear text-white transition-all lg:hidden ${showDelete ? 'flex w-14' : 'hidden'}`}
          >
            <TrashIcon size={16} />
          </button>
          {/* Desktop: hover to show */}
          <button
            onClick={handleRemove}
            className="hidden h-7 w-7 items-center justify-center rounded text-text-muted opacity-0 transition-colors hover:bg-bear/10 hover:text-bear group-hover:opacity-100 lg:inline-flex"
            title="移除标的"
          >
            <TrashIcon />
          </button>
        </TableCell>
      )}
    </TableRow>
  );
});
