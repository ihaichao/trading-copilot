import type { Signal } from '@trading-copilot/shared';

const signalStyles: Record<string, { icon: string; color: string }> = {
  pullback_long: { icon: '▲', color: 'text-bull bg-bull/8' },
  bounce_short: { icon: '▼', color: 'text-bear bg-bear/8' },
  oversold: { icon: '◆', color: 'text-bull/80 bg-bull/6' },
  overbought: { icon: '◆', color: 'text-bear/80 bg-bear/6' },
  breakout_up: { icon: '⬆', color: 'text-cyan bg-cyan/8' },
  breakout_down: { icon: '⬇', color: 'text-amber bg-amber/8' },
};

export function SignalBadge({ signal }: { signal: Signal }) {
  const style = signalStyles[signal.type] ?? {
    icon: '●',
    color: 'text-text-secondary bg-bg-hover',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide ${style.color}`}
    >
      <span className="text-[8px]">{style.icon}</span>
      {signal.label}
    </span>
  );
}
