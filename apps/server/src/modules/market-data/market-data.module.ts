import { Module } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { TwelveDataService } from './twelve-data.service';

@Module({
  providers: [MarketDataService, TwelveDataService],
  exports: [MarketDataService],
})
export class MarketDataModule {}
