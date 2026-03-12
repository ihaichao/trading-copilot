import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';

@Controller('api/watchlist')
export class WatchlistController {
  constructor(private watchlistService: WatchlistService) {}

  @Get()
  findAll() {
    return this.watchlistService.findAll();
  }

  @Post()
  create(@Body() body: { ticker: string; name?: string }) {
    return this.watchlistService.create(body.ticker, body.name);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { sortOrder?: number; name?: string },
  ) {
    return this.watchlistService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.watchlistService.remove(id);
  }
}
