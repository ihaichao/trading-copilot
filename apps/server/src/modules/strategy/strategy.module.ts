import { Module } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { StrategyController } from './strategy.controller';
import { MarketDataModule } from '../market-data/market-data.module';
import { WatchlistModule } from '../watchlist/watchlist.module';
import { PositionModule } from '../position/position.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [MarketDataModule, WatchlistModule, PositionModule, AiModule],
  controllers: [StrategyController],
  providers: [StrategyService],
})
export class StrategyModule {}
