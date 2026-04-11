const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  UPCOMING: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  ONGOING: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  PAUSED: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  PAST: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  ANNOUNCEMENT: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  BLOG: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  REPORT: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  MEETING_SUMMARY: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
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
