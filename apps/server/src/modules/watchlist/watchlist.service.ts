import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WatchlistService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.watchlistItem.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(ticker: string, name?: string) {
    const count = await this.prisma.watchlistItem.count();
    return this.prisma.watchlistItem.create({
      data: {
        ticker: ticker.toUpperCase(),
        name: name ?? null,
        sortOrder: count,
      },
    });
  }

  async update(id: number, data: { sortOrder?: number; name?: string }) {
    return this.prisma.watchlistItem.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.watchlistItem.delete({
      where: { id },
    });
  }
}
