'use client';

import { useState, useRef, useCallback } from 'react';
import type { SignalInfo, Position, AdviceAction } from '@trading-copilot/shared';
import { TrendBadge } from '../common/TrendBadge';
import { SignalBadge } from '../common/SignalBadge';
import { PositionPanel } from '../position/PositionPanel';

interface Props {
  ticker: string;
  info: SignalInfo;
  position: Position | null;
  onClosePosition: (id: number) => void;
  onRefreshAnalysis: () => void;
}

const ACTION_CONFIG: Record<
  AdviceAction,
  { label: string; icon: string; color: string; border: string; bg: string; glow: string }
> = {
  long: {
    label: '建议做多',
    icon: '▲',
    color: 'text-bull',
    border: 'border-bull/30',
    bg: 'bg-bull/5',
    glow: 'glow-bull',
  },
  short: {
    label: '建议做空',
    icon: '▼',
    color: 'text-bear',
    border: 'border-bear/30',
    bg: 'bg-bear/5',
    glow: 'glow-bear',
  },
  wait: {
    label: '暂时观望',
    icon: '⏸',
    color: 'text-amber',
    border: 'border-amber/20',
    bg: 'bg-amber/5',
    glow: '',
  },
  hold: {
    label: '继续持有',
    icon: '✊',
    color: 'text-cyan',
    border: 'border-cyan/20',
    bg: 'bg-cyan/5',
    glow: '',
  },
  close: {
    label: '建议平仓',
    icon: '✕',
    color: 'text-bear',
    border: 'border-bear/30',
    bg: 'bg-bear/5',
    glow: 'glow-bear',
  },
  reduce: {
    label: '建议减仓',
    icon: '↘',
    color: 'text-amber',
    border: 'border-amber/30',
    bg: 'bg-amber/5',
    glow: '',
  },
  add: {
    label: '可考虑加仓',
    icon: '↗',
    color: 'text-bull',
    border: 'border-bull/20',
    bg: 'bg-bull/5',
    glow: '',
  },
};

function InfoTip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLSpanElement>(null);

  const handleEnter = useCallback(() => {
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    setPos({ top: rect.top - 4, left: rect.left + rect.width / 2 });
    setShow(true);
  }, []);

  return (
    <span
      ref={iconRef}
      className="ml-1 inline-flex cursor-help"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        className={`transition-colors ${show ? 'text-text-muted' : 'text-text-muted/40'}`}
      >
        <circle cx="5" cy="5" r="4.5" stroke="currentColor" strokeWidth="1" />
        <path d="M5 4.5V7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <circle cx="5" cy="3" r="0.5" fill="currentColor" />
      </svg>
      {show && (
        <span
          className="pointer-events-none fixed z-[100] w-max max-w-48 -translate-x-1/2 -translate-y-full rounded bg-bg-elevated px-2.5 py-1.5 font-body text-[10px] leading-relaxed text-text-secondary shadow-lg ring-1 ring-border-subtle"
          style={{ top: pos.top, left: pos.left }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function CheckLight({
  label,
  passed,
  index,
  tip,
}: {
  label: string;
  passed: boolean;
  index: number;
  tip?: string;
}) {
  return (
    <div
      className="animate-fade-in flex items-center gap-1.5"
      style={{ animationDelay: `${0.3 + index * 0.08}s`, animationFillMode: 'backwards' }}
    >
      <span
        className={`font-mono text-sm leading-none ${passed ? 'text-bull' : 'text-text-muted/40'}`}
      >
        {passed ? '✓' : '✕'}
      </span>
      <span
        className={`inline-flex items-center font-body text-xs ${passed ? 'text-text-primary' : 'text-text-muted'}`}
      >
        {label}
        {tip && <InfoTip text={tip} />}
      </span>
    </div>
  );
}

function DataPair({
  label,
  value,
  color,
  tip,
}: {
  label: string;
  value: string;
  color?: string;
  tip?: string;
}) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <span className="inline-flex items-center font-body text-[11px] text-text-muted">
        {label}
        {tip && <InfoTip text={tip} />}
      </span>
      <span className={`font-mono text-xs tabular-nums ${color ?? 'text-text-primary'}`}>
        {value}
      </span>
    </div>
  );
}

export function SignalSummary({
  ticker,
  info,
  position,
  onClosePosition,
  onRefreshAnalysis,
}: Props) {
  const { advice } = info;
  const ac = ACTION_CONFIG[advice.action];
  const plan = advice.plan;

  const handleClosePosition = () => {
    if (position) {
      onClosePosition(position.id);
    }
  };

  return (
    <div className="card-surface animate-slide-up rounded p-5">
      {/* Header row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h3 className="font-display text-2xl font-bold tracking-tight text-cyan">{ticker}</h3>
        <span className="font-mono text-xl font-semibold tabular-nums text-text-primary">
          {info.close.toFixed(2)}
        </span>
        <TrendBadge trend={info.trend} />
      </div>

      {/* Position panel (if has position) */}
      {position && (
        <div className="mb-4">
          <PositionPanel
            position={position}
            currentPrice={info.close}
            onClose={handleClosePosition}
          />
        </div>
      )}

      {/* Action recommendation panel */}
      <div className={`mb-5 rounded border ${ac.border} ${ac.bg} ${ac.glow} p-4`}>
        {/* On mobile: stack action label + plan numbers. On sm+: side by side */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 font-display text-base leading-none ${ac.color}`}>
              {ac.icon}
            </span>
            <div>
              <div className={`font-display text-base font-bold leading-none ${ac.color}`}>
                {ac.label}
              </div>
              <div className="mt-2">
                <span className="font-body text-[11px] leading-relaxed text-text-secondary">
                  {advice.reasons.join('；')}
                </span>
              </div>
            </div>
          </div>

          {/* Trading plan — when plan exists */}
          {plan && (
            <div className="flex flex-wrap gap-4 sm:flex-nowrap sm:gap-5 sm:text-right">
              {plan.entry != null && (
                <div>
                  <div className="font-mono text-[9px] tracking-wider text-text-muted">入场</div>
                  <div className="font-mono text-sm tabular-nums text-text-primary">
                    {plan.entry.toFixed(2)}
                  </div>
                </div>
              )}
              <div>
                <div className="font-mono text-[9px] tracking-wider text-bear">止损</div>
                <div className="font-mono text-sm tabular-nums text-bear">
                  {plan.stop.toFixed(2)}
                </div>
              </div>
              {plan.target != null && (
                <div>
                  <div className="font-mono text-[9px] tracking-wider text-bull">目标</div>
                  <div className="font-mono text-sm tabular-nums text-bull">
                    {plan.target.toFixed(2)}
                  </div>
                </div>
              )}
              {plan.riskReward != null && (
                <div>
                  <div className="font-mono text-[9px] tracking-wider text-cyan">盈亏比</div>
                  <div className="font-mono text-sm tabular-nums text-cyan">
                    {plan.riskReward.toFixed(1)}x
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Data grid: 1 col on mobile → 2 cols on sm → 4 cols on lg */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* EMAs */}
        <div>
          <div className="section-label mb-2.5">均线指标</div>
          <div className="space-y-0.5">
            <DataPair
              label="EMA 21"
              value={info.ema21.toFixed(2)}
              color="text-amber"
              tip="21日指数均线，反映短期趋势"
            />
            <DataPair
              label="EMA 50"
              value={info.ema50.toFixed(2)}
              color="text-cyan-dim"
              tip="50日指数均线，中期趋势参考"
            />
            <DataPair
              label="EMA 100"
              value={info.ema100.toFixed(2)}
              color="text-purple"
              tip="100日指数均线，中长期趋势参考"
            />
            <DataPair
              label="EMA 200"
              value={info.ema200.toFixed(2)}
              color="text-bear/70"
              tip="200日指数均线，机构常用牛熊分界"
            />
            <div className="my-1 border-t border-border-subtle" />
            <DataPair
              label="RSI(14)"
              value={info.rsi.toFixed(1)}
              color="text-purple"
              tip="相对强弱指标，>70 超买，<30 超卖"
            />
            <DataPair
              label="StochRSI"
              value={info.stochRsi.toFixed(1)}
              color="text-purple/70"
              tip="RSI 的随机指标化，>80 超买，<20 超卖"
            />
          </div>
        </div>

        {/* Key levels */}
        <div>
          <div className="section-label mb-2.5">关键价位</div>
          <div className="space-y-0.5">
            <DataPair label="阻力" value={info.resistance?.toFixed(2) ?? '—'} color="text-bear" />
            <DataPair label="支撑" value={info.support?.toFixed(2) ?? '—'} color="text-bull" />
            {advice.action !== 'wait' && (
              <>
                <div className="my-1 border-t border-border-subtle" />
                <DataPair
                  label="多头止损"
                  value={info.stopLong.toFixed(2)}
                  tip="做多时的建议止损价位"
                />
                <DataPair
                  label="空头止损"
                  value={info.stopShort.toFixed(2)}
                  tip="做空时的建议止损价位"
                />
                {info.swingLow != null && (
                  <DataPair
                    label="摆动低点"
                    value={info.swingLow.toFixed(2)}
                    color="text-bull/60"
                    tip="近期价格波动的最低点"
                  />
                )}
                {info.swingHigh != null && (
                  <DataPair
                    label="摆动高点"
                    value={info.swingHigh.toFixed(2)}
                    color="text-bear/60"
                    tip="近期价格波动的最高点"
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Entry check */}
        <div>
          <div className="section-label mb-2.5">入场检查</div>
          <div className="space-y-2.5">
            <CheckLight
              label="结构到位"
              passed={info.checkStructure}
              index={0}
              tip="价格处于关键支撑/阻力区域"
            />
            <CheckLight
              label="信号配合"
              passed={info.checkSignal}
              index={1}
              tip="有超买超卖或突破确认信号"
            />
          </div>
          {info.allChecksPassed && (
            <div className="glow-bull mt-3 rounded-sm border border-bull/20 bg-bull/8 px-2.5 py-1.5 text-center font-mono text-[10px] font-semibold tracking-widest text-bull">
              全部通过
            </div>
          )}
        </div>

        {/* Signals */}
        <div>
          <div className="section-label mb-2.5">活跃信号</div>
          <div className="flex flex-wrap gap-1">
            {info.signals.map((s, i) => (
              <SignalBadge key={i} signal={s} />
            ))}
            {info.signals.length === 0 && (
              <span className="font-mono text-[10px] text-text-muted">无信号</span>
            )}
          </div>
          {advice.action !== 'wait' && (
            <div className="mt-3">
              <div className="section-label mb-2">盈亏比</div>
              <div className="space-y-0.5">
                <DataPair
                  label="风险"
                  value={`${info.riskDistance.toFixed(2)}%`}
                  color="text-bear"
                  tip="当前价到止损位的距离百分比"
                />
                <DataPair
                  label="收益"
                  value={info.rewardDistance != null ? `${info.rewardDistance.toFixed(2)}%` : '—'}
                  color="text-bull"
                  tip="当前价到目标位的距离百分比"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
