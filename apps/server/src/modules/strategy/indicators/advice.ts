import type { SignalInfo, Position, Advice } from '@trading-copilot/shared';
import { STRATEGY_CONFIG } from '@trading-copilot/shared';

/**
 * Two-phase advice engine.
 * Phase A (no position): entry advice (long / short / wait)
 * Phase B (has position): exit/add advice (close / reduce / add / hold)
 */
export function computeAdvice(info: SignalInfo, position: Position | null): Advice {
  const advice = position ? computeExitAdvice(info, position) : computeEntryAdvice(info);
  advice.source = 'rule';
  return advice;
}

/* ────────────────── Phase A — Entry Advice ────────────────── */

function computeEntryAdvice(info: SignalInfo): Advice {
  const isBullTrend = info.trend === 'bullish' || info.trend === 'mild_bullish';
  const isBearTrend = info.trend === 'bearish' || info.trend === 'mild_bearish';
  const mtf = info.mtf;

  // 入场信号：突破回踩/跌破反弹 + 超卖（做多）
  // 策略原则："突破回踩做多，跌破反弹做空"——突破本身不是入场点，回踩才是
  const hasLongSignal = info.signals.some(
    (s) => s.type === 'pullback_long' || s.type === 'oversold',
  );
  // 超买在空头趋势下作为做空入场参考；在多头趋势下仅作止盈参考（不触发做空）
  const hasShortSignal = info.signals.some(
    (s) => s.type === 'bounce_short' || (s.type === 'overbought' && isBearTrend),
  );

  // Multi-timeframe override: downgrade entry to wait when not aligned
  if (mtf && mtf.alignment === 'conflicting') {
    if ((isBullTrend && hasLongSignal) || (isBearTrend && hasShortSignal)) {
      return {
        action: 'wait',
        reasons: ['周线与日线方向冲突，信号可信度降低', mtf.summary, '等待多周期方向一致后再入场'],
      };
    }
  }

  if (mtf && mtf.alignment === 'neutral') {
    if ((isBullTrend && hasLongSignal) || (isBearTrend && hasShortSignal)) {
      return {
        action: 'wait',
        reasons: ['多周期信号不完全一致，建议等待确认', mtf.summary, '等待各周期趋势共振后再入场'],
      };
    }
  }

  // Long entry
  if (info.allChecksPassed && isBullTrend && hasLongSignal) {
    const reasons: string[] = [];
    reasons.push('入场检查全部通过');
    reasons.push(
      info.trend === 'bullish'
        ? '强多头趋势，价格位于所有均线上方'
        : `温和多头趋势，EMA21(${info.ema21.toFixed(2)})>EMA50(${info.ema50.toFixed(2)})`,
    );
    if (info.riskRewardRatio != null && info.riskRewardRatio >= 2) {
      reasons.push(
        `盈亏比 ${info.riskRewardRatio.toFixed(1)}x，风险${info.riskDistance.toFixed(1)}% 收益${info.rewardDistance?.toFixed(1) ?? '—'}%`,
      );
    }
    if (info.rsi < 35) {
      reasons.push(`RSI ${info.rsi.toFixed(1)} 处于超卖区域，反弹概率较高`);
    }
    // MTF enhancements
    if (mtf) {
      if (mtf.alignment === 'aligned') {
        reasons.push('多周期共振，信号增强');
      }
      // 4H refinement
      const fourHourBear =
        mtf.fourHour.trend === 'bearish' || mtf.fourHour.trend === 'mild_bearish';
      if (fourHourBear) {
        reasons.push('4H周期偏空，建议等待4H企稳后入场');
      }
      const has4hPullback = mtf.fourHour.signals.some((s) => s.type === 'pullback_long');
      if (has4hPullback) {
        reasons.push('4H出现回踩做多信号，入场时机较佳');
      }
    }
    return {
      action: 'long',
      reasons,
      plan: {
        entry: info.close,
        stop: info.stopLong,
        target: info.resistance ?? undefined,
        riskReward: info.riskRewardRatio ?? undefined,
      },
    };
  }

  // Short entry
  if (info.allChecksPassed && isBearTrend && hasShortSignal) {
    const reasons: string[] = [];
    reasons.push('入场检查全部通过');
    reasons.push(
      info.trend === 'bearish'
        ? '强空头趋势，价格位于所有均线下方'
        : `温和空头趋势，EMA21(${info.ema21.toFixed(2)})<EMA50(${info.ema50.toFixed(2)})`,
    );
    if (info.rsi > 70) {
      reasons.push(`RSI ${info.rsi.toFixed(1)} 处于超买区域，回调概率较高`);
    }
    // MTF enhancements
    if (mtf) {
      if (mtf.alignment === 'aligned') {
        reasons.push('多周期共振，信号增强');
      }
      const fourHourBull =
        mtf.fourHour.trend === 'bullish' || mtf.fourHour.trend === 'mild_bullish';
      if (fourHourBull) {
        reasons.push('4H周期偏多，建议等待4H转弱后入场');
      }
      const has4hBounce = mtf.fourHour.signals.some((s) => s.type === 'bounce_short');
      if (has4hBounce) {
        reasons.push('4H出现反弹做空信号，入场时机较佳');
      }
    }
    return {
      action: 'short',
      reasons,
      plan: {
        entry: info.close,
        stop: info.stopShort,
        target: info.support ?? undefined,
        riskReward: info.riskRewardRatio ?? undefined,
      },
    };
  }

  // Wait — explain why
  const reasons: string[] = [];

  // 超买在多头趋势中作为止盈警告，不是入场信号
  const hasOverboughtInBull = isBullTrend && info.signals.some((s) => s.type === 'overbought');
  if (hasOverboughtInBull) {
    reasons.push(`多头趋势中超买(RSI ${info.rsi.toFixed(1)})，注意止盈而非追多`);
  }

  if (!info.allChecksPassed) {
    if (!info.checkStructure) {
      const nearestEma = Math.min(info.ema21, info.ema50, info.ema100, info.ema200);
      const distPct = (((info.close - nearestEma) / nearestEma) * 100).toFixed(1);
      reasons.push(
        `价格(${info.close.toFixed(2)})偏离均线(最近${nearestEma.toFixed(2)})${Number(distPct) > 0 ? '+' : ''}${distPct}%，结构未到位`,
      );
    }
    if (!info.checkSignal) {
      reasons.push(`当前无入场信号，RSI ${info.rsi.toFixed(1)} 处于中性区域`);
    }
  } else {
    if (!isBullTrend && !isBearTrend) {
      reasons.push(`趋势为${info.trend === 'ranging' ? '中性震荡' : '不明朗'}，无明确方向`);
    }
    if (!hasLongSignal && !hasShortSignal && !hasOverboughtInBull) {
      reasons.push('无活跃入场信号触发');
    }
    if (info.riskRewardRatio != null && info.riskRewardRatio < 2) {
      reasons.push(`盈亏比仅${info.riskRewardRatio.toFixed(1)}x，不足2x最低要求`);
    }
  }
  if (reasons.length === 0) reasons.push('条件不充分，继续观察');

  return { action: 'wait', reasons };
}

/* ────────────────── Phase B — Exit / Add Advice ────────────────── */

function computeExitAdvice(info: SignalInfo, pos: Position): Advice {
  const isLong = pos.direction === 'long';
  const pnlPct = isLong
    ? ((info.close - pos.entryPrice) / pos.entryPrice) * 100
    : ((pos.entryPrice - info.close) / pos.entryPrice) * 100;
  const inProfit = pnlPct > 0;
  const daysHeld = pos.tradingDaysHeld ?? 0;
  const { timeLimitDays, halfTargetThreshold, addOnEma21Tolerance } = STRATEGY_CONFIG.position;

  // 1. Stop loss hit
  if (isLong && info.close <= pos.stopLossAtEntry) {
    return {
      action: 'close',
      reasons: [
        `现价(${info.close.toFixed(2)})已跌破入场止损(${pos.stopLossAtEntry.toFixed(2)})`,
        `当前亏损 ${pnlPct.toFixed(1)}%，建议立即止损`,
      ],
      plan: { stop: pos.stopLossAtEntry },
    };
  }
  if (!isLong && info.close >= pos.stopLossAtEntry) {
    return {
      action: 'close',
      reasons: [
        `现价(${info.close.toFixed(2)})已突破入场止损(${pos.stopLossAtEntry.toFixed(2)})`,
        `当前亏损 ${Math.abs(pnlPct).toFixed(1)}%，建议立即止损`,
      ],
      plan: { stop: pos.stopLossAtEntry },
    };
  }

  // 2. Take profit at first target (resistance for long, support for short)
  const target = isLong ? info.resistance : info.support;
  if (target !== null) {
    const reachedTarget = isLong ? info.close >= target : info.close <= target;
    if (reachedTarget) {
      return {
        action: 'reduce',
        reasons: [
          `现价(${info.close.toFixed(2)})已到达${isLong ? '阻力位' : '支撑位'}(${target.toFixed(2)})`,
          `当前盈利 ${pnlPct.toFixed(1)}%，建议减仓50%锁定利润`,
        ],
        plan: { stop: pos.stopLossAtEntry, target },
      };
    }
  }

  // 3. Trailing stop via EMA21
  const ema21Break = isLong ? info.close < info.ema21 : info.close > info.ema21;
  if (inProfit && ema21Break && daysHeld >= 3) {
    return {
      action: 'reduce',
      reasons: [
        `价格(${info.close.toFixed(2)})已${isLong ? '跌破' : '突破'}EMA21(${info.ema21.toFixed(2)})`,
        `持仓 ${daysHeld} 天盈利 ${pnlPct.toFixed(1)}%，建议减仓保护利润`,
      ],
      plan: { stop: info.ema21 },
    };
  }

  // 4. Time stop
  if (daysHeld >= timeLimitDays) {
    const targetPrice = pos.targetAtEntry;
    if (targetPrice !== null) {
      const progress = isLong
        ? (info.close - pos.entryPrice) / (targetPrice - pos.entryPrice)
        : (pos.entryPrice - info.close) / (pos.entryPrice - targetPrice);
      if (progress < halfTargetThreshold) {
        return {
          action: 'reduce',
          reasons: [
            `持仓已超${timeLimitDays}个交易日`,
            `目标完成度仅 ${(progress * 100).toFixed(0)}%，低于50%阈值`,
            `建议减仓或平仓，释放资金`,
          ],
          plan: { stop: pos.stopLossAtEntry },
        };
      }
    }
  }

  // 5. Add on EMA21 pullback
  const isTrendIntact = isLong
    ? info.trend === 'bullish' || info.trend === 'mild_bullish'
    : info.trend === 'bearish' || info.trend === 'mild_bearish';
  const nearEma21 = Math.abs(info.close - info.ema21) / info.close <= addOnEma21Tolerance;
  const hasPullbackSignal = info.signals.some(
    (s) => s.type === (isLong ? 'pullback_long' : 'bounce_short'),
  );

  if (inProfit && isTrendIntact && nearEma21 && hasPullbackSignal) {
    return {
      action: 'add',
      reasons: [
        `趋势完好(${info.trend})，价格回踩EMA21(${info.ema21.toFixed(2)})附近`,
        `当前盈利 ${pnlPct.toFixed(1)}%，可考虑加仓`,
      ],
      plan: {
        entry: info.close,
        stop: isLong ? info.stopLong : info.stopShort,
      },
    };
  }

  // 6. Add on breakout
  const hasBreakoutSignal = info.signals.some(
    (s) => s.type === (isLong ? 'breakout_up' : 'breakout_down'),
  );
  if (inProfit && isTrendIntact && hasBreakoutSignal) {
    return {
      action: 'add',
      reasons: [
        `趋势完好 + ${isLong ? '向上突破' : '向下突破'}信号`,
        `当前盈利 ${pnlPct.toFixed(1)}%，可考虑顺势加仓`,
      ],
      plan: {
        entry: info.close,
        stop: isLong ? info.stopLong : info.stopShort,
      },
    };
  }

  // 7. Hold
  return {
    action: 'hold',
    reasons: [
      `持仓 ${daysHeld} 天，当前${pnlPct >= 0 ? '盈利' : '浮亏'} ${pnlPct.toFixed(1)}%`,
      `EMA21(${info.ema21.toFixed(2)})作为移动止盈参考线`,
      `止损位 ${pos.stopLossAtEntry.toFixed(2)}`,
    ],
    plan: { stop: pos.stopLossAtEntry },
  };
}
