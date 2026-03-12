'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, type IChartApi, ColorType, CrosshairMode } from 'lightweight-charts';
import type { OhlcvBar, SignalInfo } from '@trading-copilot/shared';
import { STRATEGY_CONFIG } from '@trading-copilot/shared';
import { getChartColors } from '@/lib/chartTheme';
import { useThemeKey } from '@/hooks/useTheme';

const INTERVALS = ['1d', '1w'] as const;
const INTERVAL_LABELS: Record<string, string> = {
  '1d': '日线',
  '1w': '周线',
};

interface Props {
  bars: OhlcvBar[];
  info: SignalInfo | null;
  interval?: string;
  onIntervalChange?: (interval: string) => void;
  loading?: boolean;
}

function computeEmaClient(closes: number[], period: number): number[] {
  if (closes.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [closes[0]];
  for (let i = 1; i < closes.length; i++) {
    ema.push(closes[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

const EMA_LABELS: Record<number, string> = {
  21: 'EMA21',
  50: 'EMA50',
  100: 'EMA100',
  200: 'EMA200',
};

export function CandlestickChart({
  bars,
  info,
  interval = '1d',
  onIntervalChange,
  loading,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const themeKey = useThemeKey();

  useEffect(() => {
    if (!containerRef.current || bars.length === 0) return;

    const c = getChartColors();

    const emaColors: Record<number, string> = {
      21: c.amber,
      50: c.cyan,
      100: c.purple,
      200: c.bear,
    };

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: c.bg },
        textColor: c.text,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: c.gridV },
        horzLines: { color: c.gridH },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: c.crosshair, labelBackgroundColor: c.crosshairLabel },
        horzLine: { color: c.crosshair, labelBackgroundColor: c.crosshairLabel },
      },
      rightPriceScale: {
        borderColor: 'transparent',
        textColor: c.text,
      },
      timeScale: {
        borderColor: 'transparent',
        timeVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: 420,
    });
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: c.bull,
      downColor: c.bear,
      borderUpColor: 'transparent',
      borderDownColor: 'transparent',
      wickUpColor: c.bull + '88',
      wickDownColor: c.bear + '88',
    });

    candleSeries.setData(
      bars.map((b) => ({
        time: b.date,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      })),
    );

    // EMA lines
    const closes = bars.map((b) => b.close);
    for (const period of STRATEGY_CONFIG.ema.periods) {
      const emaValues = computeEmaClient(closes, period);
      const lineSeries = chart.addLineSeries({
        color: emaColors[period],
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      lineSeries.setData(bars.map((b, i) => ({ time: b.date, value: emaValues[i] })));
    }

    // Support/Resistance as dashed lines
    if (info?.resistance) {
      const resistLine = chart.addLineSeries({
        color: c.bear + '40',
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      resistLine.setData(bars.slice(-60).map((b) => ({ time: b.date, value: info.resistance! })));
    }
    if (info?.support) {
      const supportLine = chart.addLineSeries({
        color: c.bull + '40',
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      supportLine.setData(bars.slice(-60).map((b) => ({ time: b.date, value: info.support! })));
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [bars, info, themeKey]);

  return (
    <div>
      {/* Interval tabs + EMA legend */}
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-1.5">
        {onIntervalChange ? (
          <div className="flex">
            {INTERVALS.map((i) => (
              <button
                key={i}
                onClick={() => onIntervalChange(i)}
                className={`relative px-3 py-1 font-mono text-xs transition-colors ${
                  interval === i ? 'text-cyan' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {INTERVAL_LABELS[i]}
                {interval === i && (
                  <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-cyan" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div />
        )}
        <div className="flex gap-3">
          {STRATEGY_CONFIG.ema.periods.map((p) => (
            <span key={p} className="flex items-center gap-1">
              <span
                className={`inline-block h-0.5 w-3 rounded-full ${
                  p === 21 ? 'bg-amber' : p === 50 ? 'bg-cyan' : p === 100 ? 'bg-purple' : 'bg-bear'
                }`}
              />
              <span className="font-mono text-[9px] text-text-muted">{EMA_LABELS[p] ?? p}</span>
            </span>
          ))}
        </div>
      </div>
      {/* Chart area */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-card/60">
            <div className="h-6 w-6 animate-spin rounded-full border border-cyan/20 border-t-cyan" />
          </div>
        )}
        <div ref={containerRef} className="w-full" />
      </div>
    </div>
  );
}
