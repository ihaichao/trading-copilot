'use client';

import { useState, useCallback } from 'react';
import type { Position, CreatePositionDto } from '@trading-copilot/shared';
import { createPosition, closePosition as closePositionApi } from '@/lib/api';

export function usePosition() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPosition = useCallback(async (dto: CreatePositionDto): Promise<Position | null> => {
    try {
      setLoading(true);
      setError(null);
      return await createPosition(dto);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create position');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const closePos = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await closePositionApi(id);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to close position');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { addPosition, closePosition: closePos, loading, error };
}
