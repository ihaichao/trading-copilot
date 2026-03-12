import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';
import { MarketDataModule } from './modules/market-data/market-data.module';
import { StrategyModule } from './modules/strategy/strategy.module';
import { PositionModule } from './modules/position/position.module';

@Module({
  imports: [PrismaModule, WatchlistModule, MarketDataModule, StrategyModule, PositionModule],
})
export class AppModule {}
