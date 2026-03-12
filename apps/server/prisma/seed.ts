import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultWatchlist = [
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF' },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust' },
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'MSFT', name: 'Microsoft Corp.' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.' },
  { ticker: 'META', name: 'Meta Platforms' },
  { ticker: 'TSLA', name: 'Tesla Inc.' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.' },
];

async function main() {
  for (const [i, item] of defaultWatchlist.entries()) {
    await prisma.watchlistItem.upsert({
      where: { ticker: item.ticker },
      update: {},
      create: { ...item, sortOrder: i },
    });
  }
  console.log('Seed complete: inserted default watchlist');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
