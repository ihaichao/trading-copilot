import type {
  ScanResult,
  SignalInfo,
  OhlcvBar,
  WatchlistItem,
  Position,
  CreatePositionDto,
  UpdatePositionDto,
} from '@trading-copilot/shared';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function fetchScan(period = '1y'): Promise<ScanResult[]> {
  return fetchJson(`/scan?period=${period}`);
}

export async function fetchAnalysis(
  ticker: string,
  period = '1y',
  interval = '1d',
  signal?: AbortSignal,
): Promise<{
  bars: OhlcvBar[];
  info: SignalInfo;
  position: Position | null;
  fourHourAvailable: boolean;
}> {
  return fetchJson(`/analysis/${ticker}?period=${period}&interval=${interval}`, { signal });
}

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  return fetchJson('/watchlist');
}

export async function addToWatchlist(ticker: string, name?: string): Promise<WatchlistItem> {
  return fetchJson('/watchlist', {
    method: 'POST',
    body: JSON.stringify({ ticker, name }),
  });
}

export async function removeFromWatchlist(id: number): Promise<void> {
  await fetchJson(`/watchlist/${id}`, { method: 'DELETE' });
}

// Position API
export async function fetchPositions(onlyOpen = true): Promise<Position[]> {
  return fetchJson(`/positions?open=${onlyOpen}`);
}

export async function fetchPositionByTicker(ticker: string): Promise<Position | null> {
  return fetchJson(`/positions/${ticker}/open`);
}

export async function createPosition(dto: CreatePositionDto): Promise<Position> {
  return fetchJson('/positions', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updatePosition(id: number, dto: UpdatePositionDto): Promise<Position> {
  return fetchJson(`/positions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function closePosition(id: number): Promise<Position> {
  return fetchJson(`/positions/${id}/close`, {
    method: 'PATCH',
  });
}

export async function deletePosition(id: number): Promise<void> {
  await fetchJson(`/positions/${id}`, { method: 'DELETE' });
}
