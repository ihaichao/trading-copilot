import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { PositionService } from './position.service';
import type { CreatePositionDto, UpdatePositionDto } from '@trading-copilot/shared';

@Controller('api/positions')
export class PositionController {
  constructor(private positionService: PositionService) {}

  @Get()
  findAll(@Query('open') open?: string) {
    return this.positionService.findAll(open === 'true');
  }

  @Get(':ticker/open')
  findByTicker(@Param('ticker') ticker: string) {
    return this.positionService.findByTicker(ticker);
  }

  @Post()
  create(@Body() body: CreatePositionDto) {
    return this.positionService.create(body);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdatePositionDto) {
    return this.positionService.update(id, body);
  }

  @Patch(':id/close')
  close(@Param('id', ParseIntPipe) id: number) {
    return this.positionService.close(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.positionService.remove(id);
  }
}
