import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const YahooFinance = require('yahoo-finance2').default;
import { OhlcvBar, STRATEGY_CONFIG } from '@trading-copilot/shared';
import { TwelveDataService } from './twelve-data.service';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private readonly yf = new YahooFinance();

  constructor(private readonly twelveData: TwelveDataService) {}

  async fetchOhlcv(ticker: string, period: string = '1y'): Promise<OhlcvBar[]> {
    try {
      const result = await this.yf.chart(ticker, {
        period1: this.getPeriodStart(period),
        interval: '1d',
      });

      if (!result.quotes || result.quotes.length === 0) {
        this.logger.warn(`No data returned for ${ticker}`);
        return [];
      }

      return result.quotes
        .filter((q: any) => q.open != null && q.high != null && q.low != null && q.close != null)
        .map((q: any) => ({
          date: new Date(q.date).toISOString().split('T')[0],
          open: q.open,
          high: q.high,
          low: q.low,
          close: q.close,
          volume: q.volume ?? 0,
        }));
    } catch (error) {
      this.logger.error(`Failed to fetch data for ${ticker}`, error);
      throw error;
    }
  }

  async fetchWeekly(ticker: string): Promise<OhlcvBar[]> {
    try {
      const result = await this.yf.chart(ticker, {
        period1: this.getPeriodStart('2y'),
        interval: '1wk',
      });

      if (!result.quotes || result.quotes.length === 0) {
        this.logger.warn(`No weekly data returned for ${ticker}`);
        return [];
      }

      return result.quotes
        .filter((q: any) => q.open != null && q.high != null && q.low != null && q.close != null)
        .map((q: any) => ({
          date: new Date(q.date).toISOString().split('T')[0],
          open: q.open,
          high: q.high,
          low: q.low,
          close: q.close,
          volume: q.volume ?? 0,
        }));
    } catch (error) {
      this.logger.error(`Failed to fetch weekly data for ${ticker}`, error);
      throw error;
    }
  }

  async fetchFourHour(ticker: string): Promise<OhlcvBar[]> {
    return this.twelveData.fetchTimeSeries(
      ticker,
      '4h',
      STRATEGY_CONFIG.multiTimeframe.fourHourBarCount,
    );
  }

  isFourHourAvailable(): boolean {
    return this.twelveData.isAvailable();
  }

  private getPeriodStart(period: string): string {
    const now = new Date();
    const map: Record<string, number> = {
      '3m': 90,
      '6m': 180,
      '1y': 365,
      '2y': 730,
    };
    const days = map[period] ?? 365;
    now.setDate(now.getDate() - days);
    return now.toISOString().split('T')[0];
  }
}
