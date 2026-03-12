import { Injectable, Logger } from '@nestjs/common';
import { OhlcvBar } from '@trading-copilot/shared';

@Injectable()
export class TwelveDataService {
  private readonly logger = new Logger(TwelveDataService.name);
  private readonly baseUrl = 'https://api.twelvedata.com';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.TWELVE_DATA_API_KEY ?? '';
    if (!this.apiKey) {
      this.logger.warn('TWELVE_DATA_API_KEY not configured — 4H data will be unavailable');
    }
  }

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  async fetchTimeSeries(
    symbol: string,
    interval: '4h' | '1week',
    outputsize: number = 200,
  ): Promise<OhlcvBar[]> {
    if (!this.apiKey) {
      throw new Error('TWELVE_DATA_API_KEY not configured');
    }

    const url = `${this.baseUrl}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = (await response.json()) as {
        status?: string;
        message?: string;
        values?: any[];
      };

      if (data.status === 'error') {
        throw new Error(`Twelve Data API error: ${data.message}`);
      }

      if (!data.values || data.values.length === 0) {
        this.logger.warn(`No data returned from Twelve Data for ${symbol} (${interval})`);
        return [];
      }

      // Twelve Data returns newest first, reverse to chronological order
      return data.values
        .map((v: any) => ({
          date: v.datetime,
          open: parseFloat(v.open),
          high: parseFloat(v.high),
          low: parseFloat(v.low),
          close: parseFloat(v.close),
          volume: parseInt(v.volume, 10) || 0,
        }))
        .reverse();
    } catch (error) {
      this.logger.error(`Failed to fetch Twelve Data for ${symbol} (${interval})`, error);
      throw error;
    }
  }
}
