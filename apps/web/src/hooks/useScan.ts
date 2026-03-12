'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ScanResult } from '@trading-copilot/shared';
import { fetchScan } from '@/lib/api';

export function useScan() {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  const scan = useCallback(async (period = '1y'): Promise<ScanResult[]> => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchScan(period);
      setResults(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      scan();
    }
  }, [scan]);

  return { results, loading, error, scan };
}
