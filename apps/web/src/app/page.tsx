'use client';

import { Scanner } from '@/components/scanner/Scanner';
import { CandlestickChart } from '@/components/chart/CandlestickChart';
import { RsiChart } from '@/components/chart/RsiChart';
import { SignalSummary } from '@/components/summary/SignalSummary';
import { StrategyRulesButton } from '@/components/rules/StrategyRules';
import { GlossaryButton } from '@/components/glossary/Glossary';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { WatchlistInput } from '@/components/watchlist/WatchlistInput';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useScan } from '@/hooks/useScan';
import { useAnalysis } from '@/hooks/useAnalysis';
import { usePosition } from '@/hooks/usePosition';
import { useCallback, useRef, useState } from 'react';

export default function Home() {
  const watchlist = useWatchlist();
  const scan = useScan();
  const analysis = useAnalysis();
  const positionHook = usePosition();
  const autoSelected = useRef(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Auto-select first ticker when scan results arrive
  if (!autoSelected.current && scan.results.length > 0 && !analysis.ticker) {
    autoSelected.current = true;
    analysis.analyze(scan.results[0].ticker);
  }

  const handleSelect = useCallback(
    (ticker: string) => {
      analysis.analyze(ticker);
      setMobileView('detail');
    },
    [analysis],
  );

  const handleScan = useCallback(() => {
    scan.scan();
  }, [scan]);

  const handleAdd = useCallback(
    async (ticker: string) => {
      await watchlist.add(ticker);
      scan.scan();
    },
    [watchlist, scan],
  );

  const handleRemove = useCallback(
    async (ticker: string) => {
      const item = watchlist.items.find((w) => w.ticker === ticker);
      if (item) {
        await watchlist.remove(item.id);
        scan.scan();
      }
    },
    [watchlist, scan],
  );

  const handleClosePosition = async (id: number) => {
    const ok = await positionHook.closePosition(id);
    if (ok && analysis.ticker) {
      analysis.refresh();
    }
  };

  const handleRefreshAnalysis = () => {
    if (analysis.ticker) {
      analysis.refresh();
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-primary">
      {/* Header */}
      <header className="relative border-b border-border-subtle">
        {/* Subtle gradient line at very top */}
        <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan/20 to-transparent" />

        {/* Mobile: stack logo row and input row; Desktop: single row */}
        <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3">
          {/* Logo + nav buttons row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              {/* Logo mark */}
              <div className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center">
                <div className="absolute inset-0 rounded bg-cyan/10" />
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="relative text-cyan"
                >
                  <path
                    d="M1 10L4 6L7 8L13 2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 2H13V6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h1 className="font-display text-sm font-bold tracking-tight text-text-primary">
                  Trading Copilot
                </h1>
              </div>
            </div>

            <StrategyRulesButton />
            <GlossaryButton />
            <ThemeToggle />
          </div>

          {/* Watchlist input — full width on mobile, auto-width on desktop */}
          <div className="w-full sm:w-auto">
            <WatchlistInput onAdd={handleAdd} onScan={handleScan} scanning={scan.loading} />
          </div>
        </div>
      </header>

      {/* Main content */}
      {/* Mobile: stacked (scanner then content). lg+: side-by-side with fixed sidebar */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Scanner — full-screen on mobile list view, fixed 440px sidebar on lg+ */}
        <div
          className={`${mobileView === 'list' ? 'flex' : 'hidden'} flex-1 flex-shrink-0 flex-col overflow-y-auto border-b border-border-subtle p-2 lg:flex lg:flex-initial lg:w-[440px] lg:border-b-0 lg:border-r`}
        >
          <Scanner
            results={scan.results}
            selectedTicker={analysis.ticker}
            onSelect={handleSelect}
            onRemove={handleRemove}
            loading={scan.loading}
          />
        </div>

        {/* Right content area — full-screen on mobile detail view */}
        <div
          className={`${mobileView === 'detail' ? 'flex' : 'hidden'} flex-1 flex-col overflow-y-auto p-3 lg:flex`}
        >
          {/* Back button — mobile only */}
          <button
            onClick={() => setMobileView('list')}
            className="mb-2 flex items-center gap-1 font-mono text-xs text-text-muted hover:text-text-primary lg:hidden"
          >
            <span>←</span>
            <span>返回列表</span>
          </button>

          {analysis.loading ? (
            <div className="flex h-80 flex-col items-center justify-center">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 animate-spin rounded-full border border-cyan/20 border-t-cyan" />
                <div
                  className="absolute inset-1.5 animate-spin rounded-full border border-cyan/10 border-b-cyan/30"
                  style={{ animationDirection: 'reverse', animationDuration: '2s' }}
                />
              </div>
              <span className="mt-4 font-mono text-[10px] tracking-[0.2em] text-text-muted">
                分析中
              </span>
            </div>
          ) : analysis.error ? (
            <div className="glow-bear rounded border border-bear/20 bg-bear/5 p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-bear">&#x26A0;</span>
                <span className="font-mono text-xs text-bear">{analysis.error}</span>
              </div>
            </div>
          ) : analysis.info && analysis.ticker ? (
            <div className="space-y-2">
              <SignalSummary
                ticker={analysis.ticker}
                info={analysis.info}
                position={analysis.position}
                onClosePosition={handleClosePosition}
                onRefreshAnalysis={handleRefreshAnalysis}
              />
              <div className="card-surface rounded">
                <CandlestickChart
                  bars={analysis.bars}
                  info={analysis.info}
                  interval={analysis.interval}
                  onIntervalChange={analysis.setInterval}
                  loading={analysis.chartLoading}
                />
                <RsiChart bars={analysis.bars} loading={analysis.chartLoading} />
              </div>
            </div>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center">
              <div className="mb-4 text-4xl text-text-muted/10">◎</div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-text-muted">
                选择标的进行分析
              </p>
              <p className="mt-1 font-body text-[11px] text-text-muted/60">
                点击「全部扫描」扫描自选股，然后选择标的
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
