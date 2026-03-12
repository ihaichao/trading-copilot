interface Props {
  text: string;
}

export function InfoTip({ text }: Props) {
  return (
    <span className="group relative ml-0.5 inline-flex cursor-help items-center">
      <svg
        width="12"
        height="12"
        viewBox="0 0 16 16"
        fill="none"
        className="text-text-muted opacity-50 transition-opacity group-hover:opacity-100"
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <text
          x="8"
          y="11.5"
          textAnchor="middle"
          fill="currentColor"
          fontSize="10"
          fontWeight="600"
          fontFamily="serif"
        >
          i
        </text>
      </svg>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 rounded border border-border-subtle bg-bg-elevated px-2.5 py-1.5 font-body text-[11px] leading-relaxed text-text-secondary opacity-0 shadow-sm transition-opacity max-w-[240px] w-max group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}
