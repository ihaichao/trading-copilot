import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { MarketDataService } from '../market-data/market-data.service';
import { WatchlistService } from '../watchlist/watchlist.service';
import { PositionService } from '../position/position.service';
import { ScanResult, Position, OhlcvBar } from '@trading-copilot/shared';

@Controller('api')
export class StrategyController {
  private readonly logger = new Logger(StrategyController.name);

  constructor(
    private strategyService: StrategyService,
    private marketDataService: MarketDataService,
    private watchlistService: WatchlistService,
    private positionService: PositionService,
  ) {}

  @Get('scan')
  async scan(@Query('period') period: string = '1y'): Promise<ScanResult[]> {
    const watchlist = await this.watchlistService.findAll();
    const results: ScanResult[] = [];

    for (const item of watchlist) {
      try {
        const bars = await this.marketDataService.fetchOhlcv(item.ticker, period);
        if (bars.length < 50) continue;

        const { info } = this.strategyService.runFullAnalysis(bars);
        const prevClose = bars.length >= 2 ? bars[bars.length - 2].close : info.close;
        const changePercent = ((info.close - prevClose) / prevClose) * 100;

        results.push({
          ticker: item.ticker,
          close: info.close,
          changePercent: Math.round(changePercent * 100) / 100,
          trend: info.trend,
          signals: info.signals,
          rsi: info.rsi,
        });
      } catch (error) {
        // Skip tickers that fail silently
      }
    }

    return results;
  }

  @Get('analysis/:ticker')
  async analysis(
    @Param('ticker') ticker: string,
    @Query('period') period: string = '1y',
    @Query('interval') interval: string = '1d',
  ) {
    const upperTicker = ticker.toUpperCase();
    const dailyBars = await this.marketDataService.fetchOhlcv(upperTicker, period);

    // Look up open position for this ticker
    const dbPosition = await this.positionService.findByTicker(upperTicker);
    let position: Position | null = null;

    if (dbPosition) {
      // Compute tradingDaysHeld: count bars since entryDate
      const entryDate = new Date(dbPosition.entryDate);
      const tradingDaysHeld = dailyBars.filter((b) => new Date(b.date) >= entryDate).length;

      position = {
        id: dbPosition.id,
        ticker: dbPosition.ticker,
        direction: dbPosition.direction as 'long' | 'short',
        entryPrice: dbPosition.entryPrice,
        quantity: dbPosition.quantity,
        entryDate: dbPosition.entryDate.toISOString(),
        stopLossAtEntry: dbPosition.stopLossAtEntry,
        targetAtEntry: dbPosition.targetAtEntry,
        tradingDaysHeld,
        isOpen: dbPosition.isOpen,
        createdAt: dbPosition.createdAt.toISOString(),
        updatedAt: dbPosition.updatedAt.toISOString(),
      };
    }

    // Fetch weekly and 4H data in parallel with graceful degradation
    const fetchPromises: [Promise<OhlcvBar[]>, Promise<OhlcvBar[] | null>] = [
      this.marketDataService.fetchWeekly(upperTicker).catch((err) => {
        this.logger.warn(`Weekly data unavailable for ${upperTicker}: ${err.message}`);
        return [] as OhlcvBar[];
      }),
      this.marketDataService.isFourHourAvailable()
        ? this.marketDataService.fetchFourHour(upperTicker).catch((err) => {
            this.logger.warn(`4H data unavailable for ${upperTicker}: ${err.message}`);
            return null;
          })
        : Promise.resolve(null),
    ];

    const [weeklyBars, fourHourBars] = await Promise.all(fetchPromises);

    // Signal analysis always uses daily bars
    const { info } = await this.strategyService.runMultiTimeframeAnalysis(
      upperTicker,
      dailyBars,
      weeklyBars,
      fourHourBars,
      position,
    );

    // Return bars based on requested interval
    let bars: OhlcvBar[];
    if (interval === '1w' && weeklyBars.length > 0) {
      bars = weeklyBars;
    } else if (interval === '4h' && fourHourBars) {
      bars = fourHourBars;
    } else {
      bars = dailyBars;
    }

    return { bars, info, position, fourHourAvailable: fourHourBars !== null };
  }
}
