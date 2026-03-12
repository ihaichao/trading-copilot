'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { OhlcvBar } from '@trading-copilot/shared';
import { getChartColors } from '@/lib/chartTheme';
import { useThemeKey } from '@/hooks/useTheme';
import { InfoTip } from '@/components/common/InfoTip';

interface Props {
  bars: OhlcvBar[];
  rsiPeriod?: number;
  loading?: boolean;
}

function computeRsiClient(closes: number[], period: number): number[] {
  if (closes.length < 2) return closes.map(() => 50);
  const rsi = new Array(closes.length).fill(50);
  const deltas: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    deltas.push(closes[i] - closes[i - 1]);
  }
  let avgGain = 0,
    avgLoss = 0;
  for (let i = 0; i < Math.min(period, deltas.length); i++) {
    if (deltas[i] > 0) avgGain += deltas[i];
    else avgLoss += Math.abs(deltas[i]);
  }
  avgGain /= period;
  avgLoss /= period;
  if (period < deltas.length) {
    rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  for (let i = period; i < deltas.length; i++) {
    const gain = deltas[i] > 0 ? deltas[i] : 0;
    const loss = deltas[i] < 0 ? Math.abs(deltas[i]) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi[i + 1] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

function computeStochRsiClient(rsiValues: number[], period: number): number[] {
  const stochRsi = new Array(rsiValues.length).fill(50);
  for (let i = period; i < rsiValues.length; i++) {
    const window = rsiValues.slice(i - period + 1, i + 1);
    const min = Math.min(...window);
    const max = Math.max(...window);
    stochRsi[i] = max === min ? 50 : ((rsiValues[i] - min) / (max - min)) * 100;
  }
  return stochRsi;
}

export function RsiChart({ bars, rsiPeriod = 14, loading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const themeKey = useThemeKey();
  const [overboughtY, setOverboughtY] = useState<number | null>(null);
  const [oversoldY, setOversoldY] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || bars.length === 0) return;

    const c = getChartColors();

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
      rightPriceScale: { borderColor: 'transparent' },
      timeScale: { borderColor: 'transparent', visible: false },
      width: containerRef.current.clientWidth,
      height: 110,
    });

    const rsiValues = computeRsiClient(
      bars.map((b) => b.close),
      rsiPeriod,
    );
    const stochRsiValues = computeStochRsiClient(rsiValues, rsiPeriod);

    const rsiSeries = chart.addLineSeries({
      color: c.purple,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    rsiSeries.setData(bars.map((b, i) => ({ time: b.date, value: rsiValues[i] })));

    const stochRsiSeries = chart.addLineSeries({
      color: c.cyan,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    stochRsiSeries.setData(bars.map((b, i) => ({ time: b.date, value: stochRsiValues[i] })));

    // Overbought / oversold zones
    const addLevel = (value: number, color: string) => {
      const series = chart.addLineSeries({
        color,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      series.setData(bars.map((b) => ({ time: b.date, value })));
    };
    addLevel(70, c.bear + '30');
    addLevel(30, c.bull + '30');

    chart.timeScale().fitContent();

    const updateZonePositions = () => {
      const y70 = rsiSeries.priceToCoordinate(70);
      const y30 = rsiSeries.priceToCoordinate(30);
      setOverboughtY(y70);
      setOversoldY(y30);
    };
    updateZonePositions();
    chart.timeScale().subscribeVisibleLogicalRangeChange(updateZonePositions);

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
        updateZonePositions();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [bars, rsiPeriod, themeKey]);

  return (
    <div className="border-t border-border-subtle">
      <div className="flex items-center gap-3 px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 rounded-full bg-purple" />
          <span className="font-mono text-[9px] text-text-muted">RSI({rsiPeriod})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 rounded-full bg-cyan" />
          <span className="font-mono text-[9px] text-text-muted">StochRSI({rsiPeriod})</span>
        </div>
        <InfoTip text="RSI 衡量涨跌动能（>70 超买，<30 超卖）。StochRSI 是 RSI 的随机指标，更灵敏（>80 超买，<20 超卖）。两者同时触及极值时信号更可靠。" />
      </div>
      <div className="relative">
        {overboughtY != null && (
          <div
            className="pointer-events-none absolute left-2 z-10 font-mono text-[9px] text-bear/70"
            style={{ top: overboughtY - 6 }}
          >
            超买
          </div>
        )}
        {oversoldY != null && (
          <div
            className="pointer-events-none absolute left-2 z-10 font-mono text-[9px] text-bull/70"
            style={{ top: oversoldY - 6 }}
          >
            超卖
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-card/60">
            <div className="h-4 w-4 animate-spin rounded-full border border-cyan/20 border-t-cyan" />
          </div>
        )}
        <div ref={containerRef} className="w-full" />
      </div>
    </div>
  );
}
