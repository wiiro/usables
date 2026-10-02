/** Número pequeno ao lado do nome de uma aba. Some quando é zero. */
export function CountBadge({ count, alert }: { count?: number; alert?: boolean }) {
  if (!count) return null;
  return (
    <span
      className={[
        'rounded-full px-1.5 text-[11px] leading-4 font-semibold tabular-nums',
        alert ? 'bg-red-600 text-white dark:bg-red-500 dark:text-red-950' : 'bg-surface-muted text-fg-muted',
      ].join(' ')}
    >
      {count}
    </span>
  );
}
