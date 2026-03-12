export interface WatchlistItem {
  id: number;
  ticker: string;
  name: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
