export function getChartColors() {
  const style = getComputedStyle(document.documentElement);
  const v = (name: string) => style.getPropertyValue(name).trim();

  return {
    bg: v('--chart-bg'),
    text: v('--chart-text'),
    gridV: v('--chart-grid-v'),
    gridH: v('--chart-grid-h'),
    crosshair: v('--chart-crosshair'),
    crosshairLabel: v('--chart-crosshair-label'),
    border: v('--border'),
    borderSubtle: v('--border-subtle'),
    bull: v('--bull'),
    bear: v('--bear'),
    cyan: v('--cyan'),
    amber: v('--amber'),
    purple: v('--purple'),
    elevated: v('--bg-elevated'),
  };
}
