interface Props {
  direction: 'long' | 'short';
}

export function PositionBadge({ direction }: Props) {
  const isLong = direction === 'long';
  return (
    <span
      className={`inline-flex items-center rounded px-1 py-0.5 font-mono text-[8px] font-bold leading-none ${
        isLong ? 'bg-bull/15 text-bull' : 'bg-bear/15 text-bear'
      }`}
    >
      {isLong ? 'L' : 'S'}
    </span>
  );
}
