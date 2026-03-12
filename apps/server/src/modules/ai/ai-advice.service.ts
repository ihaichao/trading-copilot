import { Injectable, Logger } from '@nestjs/common';
import type { SignalInfo, Position, Advice, AdviceAction } from '@trading-copilot/shared';
import { OpenRouterService } from './openrouter.service';
import { computeAdvice } from '../strategy/indicators';

const VALID_ACTIONS: AdviceAction[] = ['long', 'short', 'wait', 'hold', 'close', 'reduce', 'add'];

const SYSTEM_PROMPT = `你是一个专业的交易分析助手，基于以下交易策略框架给出建议。

## 交易哲学
- 用概率思维做交易，用结构框架管理风险
- 不预测顶底，等待结构确认后顺势跟随
- 风控是绝对红线，任何单笔亏损必须可控

## 入场规则
- 总原则：突破回踩做多，跌破反弹做空（突破本身不是入场点，回踩才是）
- 两要素缺一不可：(1) 结构到位（价格在支撑/阻力 5% 以内）(2) 信号配合（超买超卖或回踩反弹信号）
- 做多：价格突破阻力后回踩 EMA21 获支撑 + EMA21>EMA50 + 放量突破缩量回踩
- 做空：价格跌破支撑后反弹 EMA21 遇阻 + EMA21<EMA50 + 放量跌破缩量反弹

## 出场规则（按优先级）
1. 止损触发 → 无条件平仓
2. 到达第一目标（阻力/支撑）→ 减仓 50%
3. 移动止盈：盈利中 + 收盘跌破 EMA21（多）/ 站上 EMA21（空）→ 减仓
4. 时间止损：持仓超 10 交易日 + 未达目标 50% → 减仓
5. 加仓：盈利中 + 趋势完好 + 回踩 EMA21 或突破信号
6. 持有：以上均未触发

## 超买超卖处理
- 超买在多头趋势中仅作止盈参考，不触发做空
- 超买在空头趋势中作为做空入场参考
- 超卖信号提示关注做多，但需等待结构确认

## 多周期一致性
- 大周期定方向，小周期找入场
- 周线与日线方向冲突时降低信号置信度
- RSI 的绝对值很重要：RSI 20 的超卖远比 RSI 33 更有意义

## 权衡原则
- 综合考虑所有因素的强弱程度，不要非黑即白
- RSI 越极端，信号越强
- 多周期共振时信号更可信
- 盈亏比越高，入场越值得

## 输出要求
严格输出 JSON 格式（不要输出其他内容）：
{
  "action": "long" | "short" | "wait" | "hold" | "close" | "reduce" | "add",
  "reasons": ["一段完整的分析文字"],
  "plan": { "entry": 数值, "stop": 数值, "target": 数值, "riskReward": 数值 }
}

- 无持仓时 action 只能是 long / short / wait
- 有持仓时 action 只能是 hold / close / reduce / add
- reasons 数组只放一个字符串，内容是一段连续、完整的中文分析（80-150字），涵盖趋势判断、关键指标解读、信号强弱评估、多周期一致性、以及最终结论和理由。不要分条，写成一段自然流畅的话。
- plan 在 action 为 long/short/add 时必须提供 entry 和 stop；wait/hold 时可省略或仅提供 stop
- plan 中的 target 和 riskReward 可选`;

@Injectable()
export class AiAdviceService {
  private readonly logger = new Logger(AiAdviceService.name);
  private readonly cache = new Map<string, { advice: Advice; ts: number }>();
  private readonly cacheTtlMs = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private readonly openRouter: OpenRouterService) {}

  async generateAdvice(
    ticker: string,
    info: SignalInfo,
    position: Position | null,
  ): Promise<Advice> {
    if (!this.openRouter.isAvailable()) {
      return computeAdvice(info, position);
    }

    const userPrompt = this.buildUserPrompt(ticker, info, position);
    const cached = this.cache.get(userPrompt);
    if (cached && Date.now() - cached.ts < this.cacheTtlMs) {
      this.logger.log(`Using cached AI advice for ${ticker}`);
      return cached.advice;
    }

    try {
      const response = await this.openRouter.chat([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ]);
      const advice = this.parseResponse(response, info, position);
      this.cache.set(userPrompt, { advice, ts: Date.now() });
      return advice;
    } catch (error) {
      this.logger.warn(`AI advice failed, falling back to rule engine: ${error}`);
      return computeAdvice(info, position);
    }
  }

  private buildUserPrompt(ticker: string, info: SignalInfo, position: Position | null): string {
    const trendLabels: Record<string, string> = {
      bullish: '多头',
      mild_bullish: '偏多',
      bearish: '空头',
      mild_bearish: '偏空',
      ranging: '震荡',
    };

    const lines: string[] = [
      `标的: ${ticker}`,
      `现价: ${info.close}`,
      `趋势: ${info.trend} (${trendLabels[info.trend] ?? info.trend})`,
      `EMA: 21=${info.ema21}, 50=${info.ema50}, 100=${info.ema100}, 200=${info.ema200}`,
      `RSI(14): ${info.rsi}, StochRSI(14): ${info.stochRsi}`,
      `活跃信号: [${info.signals.map((s) => s.label).join(', ') || '无'}]`,
      `阻力位: ${info.resistance ?? '无'}, 支撑位: ${info.support ?? '无'}`,
      `止损(多): ${info.stopLong}, 止损(空): ${info.stopShort}`,
      `结构到位: ${info.checkStructure ? '✓' : '✗'}, 信号配合: ${info.checkSignal ? '✓' : '✗'}, 全部通过: ${info.allChecksPassed ? '✓' : '✗'}`,
      `风险: ${info.riskDistance}%, 收益: ${info.rewardDistance ?? '—'}%, 盈亏比: ${info.riskRewardRatio != null ? info.riskRewardRatio + 'x' : '—'}`,
    ];

    // Multi-timeframe context
    if (info.mtf) {
      const { weekly, daily, fourHour, alignment } = info.mtf;
      lines.push(
        `多周期: 周线${trendLabels[weekly.trend] ?? weekly.trend}, 日线${trendLabels[daily.trend] ?? daily.trend}, 4H${trendLabels[fourHour.trend] ?? fourHour.trend}`,
      );
      lines.push(`多周期对齐: ${alignment}`);
    }

    // Position context
    if (position) {
      const isLong = position.direction === 'long';
      const pnlPct = isLong
        ? ((info.close - position.entryPrice) / position.entryPrice) * 100
        : ((position.entryPrice - info.close) / position.entryPrice) * 100;
      lines.push(
        `持仓: ${position.direction} @ ${position.entryPrice}, ${position.quantity}股, 持仓${position.tradingDaysHeld ?? 0}天`,
      );
      lines.push(`浮动盈亏: ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%`);
      lines.push(
        `入场止损: ${position.stopLossAtEntry}, 入场目标: ${position.targetAtEntry ?? '无'}`,
      );
    } else {
      lines.push(`持仓: 无`);
    }

    return lines.join('\n');
  }

  private parseResponse(response: string, info: SignalInfo, position: Position | null): Advice {
    // Extract JSON from response (may be wrapped in markdown code block)
    const jsonMatch =
      response.match(/```(?:json)?\s*([\s\S]*?)```/) || response.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      this.logger.warn('AI response contains no JSON, falling back to rule engine');
      return computeAdvice(info, position);
    }

    const parsed = JSON.parse(jsonMatch[1].trim());

    // Validate action
    if (!VALID_ACTIONS.includes(parsed.action)) {
      this.logger.warn(`Invalid action "${parsed.action}", falling back to rule engine`);
      return computeAdvice(info, position);
    }

    // Normalize reasons: accept string or string[]
    if (typeof parsed.reasons === 'string') {
      parsed.reasons = [parsed.reasons];
    }
    if (
      !Array.isArray(parsed.reasons) ||
      parsed.reasons.length === 0 ||
      !parsed.reasons.every((r: unknown) => typeof r === 'string')
    ) {
      this.logger.warn(
        `Invalid reasons format: ${JSON.stringify(parsed.reasons)}, falling back to rule engine`,
      );
      return computeAdvice(info, position);
    }

    // Validate action is appropriate for position state
    const entryActions: AdviceAction[] = ['long', 'short', 'wait'];
    const exitActions: AdviceAction[] = ['hold', 'close', 'reduce', 'add'];
    if (position && entryActions.includes(parsed.action)) {
      this.logger.warn(`Action "${parsed.action}" not valid with open position, falling back`);
      return computeAdvice(info, position);
    }
    if (!position && exitActions.includes(parsed.action)) {
      this.logger.warn(`Action "${parsed.action}" not valid without position, falling back`);
      return computeAdvice(info, position);
    }

    const advice: Advice = {
      action: parsed.action,
      reasons: parsed.reasons,
      source: 'ai',
    };

    // Parse optional plan
    if (parsed.plan && typeof parsed.plan === 'object') {
      const plan: Advice['plan'] = { stop: 0 };
      if (typeof parsed.plan.entry === 'number') plan.entry = parsed.plan.entry;
      if (typeof parsed.plan.stop === 'number') plan.stop = parsed.plan.stop;
      if (typeof parsed.plan.target === 'number') plan.target = parsed.plan.target;
      if (typeof parsed.plan.riskReward === 'number') plan.riskReward = parsed.plan.riskReward;
      // Only include plan if stop was actually provided
      if (parsed.plan.stop != null) {
        advice.plan = plan;
      }
    }

    return advice;
  }
}
