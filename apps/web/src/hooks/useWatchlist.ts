'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WatchlistItem } from '@trading-copilot/shared';
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/api';

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWatchlist();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(async (ticker: string, name?: string) => {
    const item = await addToWatchlist(ticker, name);
    setItems((prev) => [...prev, item]);
  }, []);

  const remove = useCallback(async (id: number) => {
    await removeFromWatchlist(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { items, loading, error, add, remove, reload: load };
}
