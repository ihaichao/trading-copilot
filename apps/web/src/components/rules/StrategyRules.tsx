'use client';

import { useState, useEffect, useCallback } from 'react';

export function StrategyRulesButton() {
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-sm border border-border bg-bg-card px-2.5 py-1.5 font-mono text-[10px] tracking-wider text-amber transition-all hover:border-amber/30 hover:bg-amber/5"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        </svg>
        规则
      </button>

      {open && <StrategyRulesModal onClose={() => setOpen(false)} />}
    </>
  );
}

function StrategyRulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-lg animate-slide-up card-surface rounded-lg p-5 sm:p-6 max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
        {/* Top gradient line */}
        <div className="absolute left-0 right-0 top-0 h-[1px] rounded-t-lg bg-gradient-to-r from-transparent via-amber/30 to-transparent" />

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-amber shadow-[0_0_6px_var(--amber)]" />
            <span className="section-label">策略规则</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M1 1l8 8M9 1l-8 8"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        {/* 1 column on mobile, 2 on sm+ */}
        <div className="grid grid-cols-1 gap-4 text-[11px] leading-relaxed text-text-secondary sm:grid-cols-2 sm:gap-5">
          <RuleSection
            title="做多入场"
            color="text-bull"
            dotColor="bg-bull"
            rules={[
              '突破近期阻力位（收盘确认）',
              '回踩 EMA21 获支撑，收盘站稳',
              'EMA21 > EMA50 多头排列',
              '突破放量 · 回踩缩量',
              '10 个交易日内有效',
            ]}
          />

          <RuleSection
            title="做空入场"
            color="text-bear"
            dotColor="bg-bear"
            rules={[
              '跌破近期支撑位（收盘确认）',
              '反弹 EMA21 遇阻，收盘在下方',
              'EMA21 < EMA50 空头排列',
              '跌破放量 · 反弹缩量',
              '10 个交易日内有效',
            ]}
          />

          <RuleSection
            title="超买/超卖信号"
            color="text-purple"
            dotColor="bg-purple"
            rules={[
              '超卖: RSI < 35 + StochRSI < 20',
              '超买: RSI > 70 + StochRSI > 80',
              '超卖 → 关注做多',
              '超买 + 空头 → 做空参考',
            ]}
          />

          <RuleSection
            title="退出规则"
            color="text-cyan"
            dotColor="bg-cyan"
            rules={[
              '止损: EMA50 外侧 1%',
              '第一目标: 平仓 50%',
              '移动止盈: EMA21 移动止损线',
              '时间止损: 10 日未达预期减仓',
            ]}
          />
        </div>

        {/* Three Essentials */}
        <div className="mt-5 border-t border-border-subtle pt-4">
          <div className="mb-2.5 font-mono text-[9px] font-semibold tracking-[0.15em] text-amber">
            三要素
          </div>
          {/* 1 col on mobile, 3 on sm+ */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {[
              { n: '01', label: '结构到位', desc: '价格在关键支撑/阻力区' },
              { n: '02', label: '信号配合', desc: '超买超卖或突破确认' },
              { n: '03', label: '止损清晰', desc: '入场前已明确止损位' },
            ].map((item) => (
              <div
                key={item.n}
                className="rounded-sm border border-border-subtle bg-bg-elevated/50 p-2.5"
              >
                <div className="font-mono text-[9px] text-amber/60">{item.n}</div>
                <div className="font-body text-xs font-medium text-text-primary">{item.label}</div>
                <div className="mt-0.5 font-body text-[10px] text-text-muted">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RuleSection({
  title,
  color,
  dotColor,
  rules,
}: {
  title: string;
  color: string;
  dotColor: string;
  rules: string[];
}) {
  return (
    <section>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className={`h-1 w-1 rounded-full ${dotColor}`} />
        <span className={`font-mono text-[9px] font-semibold tracking-[0.15em] ${color}`}>
          {title}
        </span>
      </div>
      <ul className="space-y-0.5 pl-3 font-body">
        {rules.map((rule, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="mt-1.5 h-0.5 w-0.5 flex-shrink-0 rounded-full bg-text-muted" />
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
