'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { OhlcvBar, SignalInfo, Position } from '@trading-copilot/shared';
import { fetchAnalysis } from '@/lib/api';

export function useAnalysis() {
  const [bars, setBars] = useState<OhlcvBar[]>([]);
  const [info, setInfo] = useState<SignalInfo | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticker, setTicker] = useState<string | null>(null);
  const [interval, setIntervalState] = useState<string>('1d');
  const [fourHourAvailable, setFourHourAvailable] = useState(false);
  const [fetchSeq, setFetchSeq] = useState(0);
  const mountedRef = useRef(true);
  // Track whether this fetch is interval-only (chart refresh) vs full analysis
  const prevTickerRef = useRef<string | null>(null);
  const prevSeqRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!ticker) return;

    const controller = new AbortController();
    let cancelled = false;

    // Determine if this is just an interval change (same ticker, same seq)
    const isIntervalOnly = ticker === prevTickerRef.current && fetchSeq === prevSeqRef.current;
    prevTickerRef.current = ticker;
    prevSeqRef.current = fetchSeq;

    if (isIntervalOnly) {
      setChartLoading(true);
    } else {
      setLoading(true);
    }
    setError(null);

    fetchAnalysis(ticker, '1y', interval, controller.signal)
      .then((data) => {
        if (cancelled || !mountedRef.current) return;
        setBars(data.bars);
        if (!isIntervalOnly) {
          setInfo(data.info);
          setPosition(data.position);
          setFourHourAvailable(data.fourHourAvailable);
        }
      })
      .catch((e) => {
        if (cancelled || !mountedRef.current) return;
        setError(e instanceof Error ? e.message : 'Analysis failed');
      })
      .finally(() => {
        if (cancelled || !mountedRef.current) return;
        setLoading(false);
        setChartLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [ticker, interval, fetchSeq]);

  const analyze = useCallback((t: string) => {
    setTicker(t);
    setIntervalState('1d');
    setFetchSeq((s) => s + 1);
  }, []);

  const setInterval = useCallback((i: string) => {
    setIntervalState(i);
  }, []);

  const refresh = useCallback(() => {
    setFetchSeq((s) => s + 1);
  }, []);

  return {
    bars,
    info,
    position,
    ticker,
    interval,
    fourHourAvailable,
    loading,
    chartLoading,
    error,
    analyze,
    setInterval,
    refresh,
  };
}
