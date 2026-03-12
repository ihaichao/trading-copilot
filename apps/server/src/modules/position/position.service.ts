import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreatePositionDto, UpdatePositionDto } from '@trading-copilot/shared';

@Injectable()
export class PositionService {
  constructor(private prisma: PrismaService) {}

  async findAll(onlyOpen?: boolean) {
    return this.prisma.position.findMany({
      where: onlyOpen ? { isOpen: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByTicker(ticker: string) {
    return this.prisma.position.findFirst({
      where: { ticker: ticker.toUpperCase(), isOpen: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreatePositionDto) {
    return this.prisma.position.create({
      data: {
        ticker: dto.ticker.toUpperCase(),
        direction: dto.direction,
        entryPrice: dto.entryPrice,
        quantity: dto.quantity,
        entryDate: new Date(dto.entryDate),
        stopLossAtEntry: dto.stopLossAtEntry,
        targetAtEntry: dto.targetAtEntry ?? null,
      },
    });
  }

  async update(id: number, dto: UpdatePositionDto) {
    return this.prisma.position.update({
      where: { id },
      data: dto,
    });
  }

  async close(id: number) {
    return this.prisma.position.update({
      where: { id },
      data: { isOpen: false },
    });
  }

  async remove(id: number) {
    return this.prisma.position.delete({
      where: { id },
    });
  }
}
