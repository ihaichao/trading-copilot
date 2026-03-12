'use client';

import { useState } from 'react';
import type { SignalInfo, CreatePositionDto, PositionDirection } from '@trading-copilot/shared';

interface Props {
  ticker: string;
  info: SignalInfo;
  onSubmit: (dto: CreatePositionDto) => void;
  onCancel: () => void;
}

export function PositionForm({ ticker, info, onSubmit, onCancel }: Props) {
  const defaultDirection: PositionDirection = info.advice.action === 'short' ? 'short' : 'long';
  const defaultStop = defaultDirection === 'long' ? info.stopLong : info.stopShort;
  const defaultTarget = defaultDirection === 'long' ? info.resistance : info.support;

  const [direction, setDirection] = useState<PositionDirection>(defaultDirection);
  const [entryPrice, setEntryPrice] = useState(info.close.toFixed(2));
  const [quantity, setQuantity] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [stopLoss, setStopLoss] = useState(defaultStop.toFixed(2));
  const [target, setTarget] = useState(defaultTarget?.toFixed(2) ?? '');

  const handleDirectionChange = (dir: PositionDirection) => {
    setDirection(dir);
    setStopLoss(dir === 'long' ? info.stopLong.toFixed(2) : info.stopShort.toFixed(2));
    setTarget((dir === 'long' ? info.resistance : info.support)?.toFixed(2) ?? '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ticker,
      direction,
      entryPrice: parseFloat(entryPrice),
      quantity: parseFloat(quantity),
      entryDate,
      stopLossAtEntry: parseFloat(stopLoss),
      targetAtEntry: target ? parseFloat(target) : null,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded border border-border-subtle bg-bg-card p-4"
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-xs font-bold tracking-wider text-text-muted">
          建立仓位
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="font-mono text-[10px] text-text-muted hover:text-text-primary"
        >
          取消
        </button>
      </div>

      {/* Direction toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleDirectionChange('long')}
          className={`flex-1 rounded px-3 py-1.5 font-mono text-xs font-bold transition-colors ${
            direction === 'long'
              ? 'bg-bull/20 text-bull'
              : 'bg-bg-elevated text-text-muted hover:text-text-secondary'
          }`}
        >
          做多
        </button>
        <button
          type="button"
          onClick={() => handleDirectionChange('short')}
          className={`flex-1 rounded px-3 py-1.5 font-mono text-xs font-bold transition-colors ${
            direction === 'short'
              ? 'bg-bear/20 text-bear'
              : 'bg-bg-elevated text-text-muted hover:text-text-secondary'
          }`}
        >
          做空
        </button>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="入场价" value={entryPrice} onChange={setEntryPrice} />
        <Field label="数量" value={quantity} onChange={setQuantity} placeholder="股数" />
        <Field label="入场日期" value={entryDate} onChange={setEntryDate} type="date" />
        <Field label="止损" value={stopLoss} onChange={setStopLoss} />
        <Field label="目标" value={target} onChange={setTarget} placeholder="可选" />
      </div>

      <button
        type="submit"
        disabled={!quantity || parseFloat(quantity) <= 0}
        className={`w-full rounded py-2 font-mono text-xs font-bold transition-colors ${
          direction === 'long'
            ? 'bg-bull/20 text-bull hover:bg-bull/30 disabled:bg-bull/5 disabled:text-bull/30'
            : 'bg-bear/20 text-bear hover:bg-bear/30 disabled:bg-bear/5 disabled:text-bear/30'
        }`}
      >
        确认建仓
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="font-body text-[10px] text-text-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-0.5 w-full rounded border border-border-subtle bg-bg-primary px-2 py-1 font-mono text-xs text-text-primary outline-none focus:border-cyan/50"
      />
    </div>
  );
}
