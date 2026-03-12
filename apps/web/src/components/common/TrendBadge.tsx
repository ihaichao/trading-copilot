import type { TrendType } from '@trading-copilot/shared';

const trendConfig: Record<TrendType, { label: string; bg: string; text: string; dot: string }> = {
  bullish: {
    label: '多头',
    bg: 'bg-bull/8',
    text: 'text-bull',
    dot: 'bg-bull shadow-[0_0_6px_var(--bull)]',
  },
  mild_bullish: {
    label: '偏多',
    bg: 'bg-bull/5',
    text: 'text-bull/70',
    dot: 'bg-bull/60',
  },
  ranging: {
    label: '震荡',
    bg: 'bg-amber/5',
    text: 'text-amber',
    dot: 'bg-amber/60',
  },
  mild_bearish: {
    label: '偏空',
    bg: 'bg-bear/5',
    text: 'text-bear/70',
    dot: 'bg-bear/60',
  },
  bearish: {
    label: '空头',
    bg: 'bg-bear/8',
    text: 'text-bear',
    dot: 'bg-bear shadow-[0_0_6px_var(--bear)]',
  },
};

export function TrendBadge({ trend }: { trend: TrendType }) {
  const c = trendConfig[trend];
  return (
    <span
      className={`inline-flex whitespace-nowrap items-center gap-1 rounded-sm px-1.5 font-mono text-[10px] font-medium leading-[16px] tracking-wider ${c.bg} ${c.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
