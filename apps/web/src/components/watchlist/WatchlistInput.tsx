'use client';

import { useState } from 'react';

interface Props {
  onAdd: (ticker: string) => Promise<void>;
  onScan: () => void;
  scanning: boolean;
}

export function WatchlistInput({ onAdd, onScan, scanning }: Props) {
  const [ticker, setTicker] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!ticker.trim()) return;
    setAdding(true);
    try {
      await onAdd(ticker.trim().toUpperCase());
      setTicker('');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      {/* Input grows to fill available space on mobile */}
      <div className="relative min-w-0 flex-1 sm:flex-none">
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="输入代码"
          className="w-full rounded-sm border border-border bg-bg-card px-3 py-1.5 font-mono text-xs tracking-wider text-text-primary placeholder:text-text-muted focus:border-cyan/40 focus:outline-none sm:w-28"
        />
      </div>
      <button
        onClick={handleAdd}
        disabled={adding || !ticker.trim()}
        className="flex-shrink-0 rounded-sm border border-border bg-bg-card px-3 py-1.5 font-mono text-xs tracking-wider text-cyan transition-all hover:border-cyan/30 hover:bg-cyan/5 disabled:opacity-30"
      >
        {adding ? '···' : '+ 添加'}
      </button>
      <button
        onClick={onScan}
        disabled={scanning}
        className="group relative flex-shrink-0 overflow-hidden rounded-sm border border-bull/20 bg-bull/5 px-4 py-1.5 font-mono text-xs font-medium tracking-wider text-bull transition-all hover:border-bull/40 hover:bg-bull/10 disabled:opacity-30"
      >
        {scanning && (
          <span className="absolute inset-0 animate-scan-line bg-gradient-to-r from-transparent via-bull/10 to-transparent" />
        )}
        <span className="relative">{scanning ? '扫描中' : '全部扫描'}</span>
      </button>
    </div>
  );
}
