'use client';

import { useState, useEffect, useCallback } from 'react';

const GLOSSARY_ITEMS: { term: string; abbr?: string; color: string; desc: string }[] = [
  {
    term: 'EMA 21',
    abbr: 'Exponential Moving Average',
    color: 'text-amber',
    desc: '21 日指数移动平均线。对近期价格赋予更高权重，反映短期趋势方向。价格站上 EMA21 为短期偏多，跌破为偏空。',
  },
  {
    term: 'EMA 50',
    abbr: 'Exponential Moving Average',
    color: 'text-cyan',
    desc: '50 日指数移动平均线。中期趋势的核心参考线。EMA21 上穿 EMA50（金叉）为多头信号，下穿（死叉）为空头信号。',
  },
  {
    term: 'EMA 100 / 200',
    abbr: 'Exponential Moving Average',
    color: 'text-purple',
    desc: '长期趋势参考线。EMA200 是机构常用的牛熊分界线，价格在其上方为长期多头市场。',
  },
  {
    term: 'RSI',
    abbr: 'Relative Strength Index',
    color: 'text-purple',
    desc: '相对强弱指标（14 日）。衡量价格涨跌动能，范围 0–100。RSI > 70 为超买区，可能面临回调；RSI < 30 为超卖区，可能出现反弹。',
  },
  {
    term: 'StochRSI',
    abbr: 'Stochastic RSI',
    color: 'text-purple',
    desc: 'RSI 的随机指标化处理，比 RSI 更灵敏。StochRSI > 80 超买，< 20 超卖。常与 RSI 配合使用确认超买超卖信号。',
  },
  {
    term: '支撑位',
    abbr: 'Support',
    color: 'text-bull',
    desc: '价格在历史上多次获得买盘支撑的价位区域。跌至支撑位附近往往会出现反弹，跌破则可能加速下跌。',
  },
  {
    term: '阻力位',
    abbr: 'Resistance',
    color: 'text-bear',
    desc: '价格在历史上多次遇到卖压的价位区域。涨至阻力位附近往往受阻回落，突破则可能加速上涨。',
  },
  {
    term: '突破',
    abbr: 'Breakout',
    color: 'text-bull',
    desc: '价格以较大成交量穿越支撑或阻力位。有效突破需要收盘确认，且伴随放量。突破后原阻力变支撑（或反之）。',
  },
  {
    term: '回踩',
    abbr: 'Pullback',
    color: 'text-cyan',
    desc: '突破后价格短暂回到突破位附近再次确认。健康的回踩通常缩量，并在关键均线（如 EMA21）获得支撑后继续原方向。',
  },
  {
    term: '多头排列',
    abbr: 'Bullish Alignment',
    color: 'text-bull',
    desc: 'EMA21 > EMA50 > EMA100 > EMA200，短期均线在长期均线上方。表示各周期趋势一致向上，是做多的有利环境。',
  },
  {
    term: '空头排列',
    abbr: 'Bearish Alignment',
    color: 'text-bear',
    desc: 'EMA21 < EMA50 < EMA100 < EMA200，短期均线在长期均线下方。表示各周期趋势一致向下，是做空的有利环境。',
  },
  {
    term: 'MA20 成交量',
    abbr: 'Volume MA20',
    color: 'text-amber',
    desc: '20 日平均成交量。用于判断当前成交量是否异常。突破日成交量 > MA20 为放量确认，回踩日成交量 < MA20 为缩量确认。',
  },
  {
    term: '综合得分',
    abbr: 'Score 0–100',
    color: 'text-cyan',
    desc: '系统对标的交易机会的综合评分。基础分 50（中性），趋势方向 ±20，RSI 超卖 +15 / 超买 -10，回踩做多 +20 / 反弹做空 -20，成交量确认 +10，完美 EMA 排列 +5。分数越高越适合做多，越低越适合做空。',
  },
];

export function GlossaryButton() {
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
        className="flex items-center gap-1.5 rounded-sm border border-border bg-bg-card px-2.5 py-1.5 font-mono text-[10px] tracking-wider text-cyan transition-all hover:border-cyan/30 hover:bg-cyan/5"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
          <path
            d="M4.5 4.5C4.5 3.67 5.17 3 6 3s1.5.67 1.5 1.5c0 .83-.75 1-1.5 1.5"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <circle cx="6" cy="9" r="0.5" fill="currentColor" />
        </svg>
        术语
      </button>

      {open && <GlossaryModal onClose={() => setOpen(false)} />}
    </>
  );
}

function GlossaryModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="relative mx-4 flex w-full max-w-2xl animate-slide-up card-surface rounded-lg max-h-[90vh] sm:max-h-[80vh] flex-col overflow-hidden">
        {/* Top gradient line */}
        <div className="absolute left-0 right-0 top-0 h-[1px] rounded-t-lg bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

        {/* Header — fixed */}
        <div className="flex flex-shrink-0 items-center justify-between px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_var(--cyan)]" />
            <span className="section-label">术语表</span>
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

        {/* Glossary items — scrollable */}
        <div className="space-y-3 overflow-y-auto px-4 pb-5 sm:px-6 sm:pb-6">
          {GLOSSARY_ITEMS.map((item) => (
            <div
              key={item.term}
              className="rounded-sm border border-border-subtle bg-bg-elevated/50 px-4 py-3"
            >
              <div className="flex items-baseline gap-2">
                <span className={`font-mono text-xs font-semibold ${item.color}`}>{item.term}</span>
                {item.abbr && (
                  <span className="font-mono text-[9px] text-text-muted">{item.abbr}</span>
                )}
              </div>
              <p className="mt-1.5 font-body text-[11px] leading-relaxed text-text-secondary">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
