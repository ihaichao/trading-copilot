import type { ScanResult } from '@trading-copilot/shared';
import { ScannerRow } from './ScannerRow';
import { Table, TableHeader, TableBody, TableRow, TableHead } from '@/components/ui/table';

interface Props {
  results: ScanResult[];
  selectedTicker: string | null;
  onSelect: (ticker: string) => void;
  onRemove?: (ticker: string) => void;
  loading: boolean;
}

export function Scanner({ results, selectedTicker, onSelect, onRemove, loading }: Props) {
  return (
    <div className="card-surface flex flex-1 flex-col overflow-hidden rounded">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-border-subtle px-4 py-3">
        <div className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_var(--cyan)]" />
        <span className="section-label">信号扫描</span>
        {results.length > 0 && (
          <span className="ml-auto font-mono text-[10px] text-text-muted">
            {results.length} 个标的
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 animate-spin rounded-full border border-cyan/30 border-t-cyan" />
              <div
                className="absolute inset-1 animate-spin rounded-full border border-cyan/10 border-b-cyan/40"
                style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
              />
            </div>
            <span className="mt-3 font-mono text-[10px] tracking-widest text-text-muted">
              扫描中
            </span>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-3 text-2xl text-text-muted/30">◎</div>
            <p className="font-mono text-[10px] tracking-widest text-text-muted">
              点击「全部扫描」开始
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标的</TableHead>
                <TableHead className="text-right">价格</TableHead>
                <TableHead className="text-right">涨跌%</TableHead>
                <TableHead>趋势</TableHead>
                <TableHead>信号</TableHead>
                {onRemove && <TableHead className="w-0 p-0" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r, i) => (
                <ScannerRow
                  key={r.ticker}
                  result={r}
                  selected={r.ticker === selectedTicker}
                  onSelect={onSelect}
                  onRemove={onRemove}
                  index={i}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
