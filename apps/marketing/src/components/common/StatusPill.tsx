const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  UPCOMING: { bg: 'bg-info/10', text: 'text-info', dot: 'bg-info' },
  ONGOING: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning' },
  COMPLETED: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  PAUSED: { bg: 'bg-base-200', text: 'text-base-content/55', dot: 'bg-base-content/35' },
  PAST: { bg: 'bg-base-200', text: 'text-base-content/55', dot: 'bg-base-content/35' },
  CANCELLED: { bg: 'bg-error/10', text: 'text-error', dot: 'bg-error' },
  ACTIVE: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  ANNOUNCEMENT: { bg: 'bg-info/10', text: 'text-info', dot: 'bg-info' },
  BLOG: { bg: 'bg-accent/10', text: 'text-accent', dot: 'bg-accent' },
  REPORT: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning' },
  MEETING_SUMMARY: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  FEATURED: { bg: 'bg-secondary/10', text: 'text-secondary', dot: 'bg-secondary' },
};

const fallback = { bg: 'bg-primary/5', text: 'text-primary', dot: 'bg-primary' };

interface StatusPillProps {
  status: string;
  className?: string;
}

export default function StatusPill({ status, className = '' }: StatusPillProps) {
  const style = statusStyles[status.toUpperCase()] || fallback;
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${style.bg} ${style.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}
