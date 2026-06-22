import { motion } from 'framer-motion';
import { Crown, Shield, Star } from 'lucide-react';
import LeadershipProfileCard from './LeadershipProfileCard.tsx';

interface Executive {
  id: string;
  name: string;
  position: string;
  classOf: string;
  photoUrl: string | null;
  order: number;
}

interface Props {
  executives: Executive[];
}

/* ─── Tier classification by position keywords ────────────── */

const TIER_RULES: { tier: number; keywords: string[] }[] = [
  { tier: 0, keywords: ['president'] },
  { tier: 1, keywords: ['vice president', 'secretary', 'treasurer'] },
  { tier: 2, keywords: ['officer', 'organising', 'welfare', 'representative'] },
  { tier: 3, keywords: ['chair', 'coordinator', 'chapter', 'committee', 'foundation'] },
];

function getTier(position: string): number {
  const lower = position.toLowerCase();
  if (lower.includes('vice')) return 1;
  for (const rule of TIER_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) return rule.tier;
  }
  return 3;
}

/* ─── Pyramid row layout: 1, 2, 3, 4, 4, 4... ─────────────── */

function buildPyramidRows(executives: Executive[]): { row: Executive[]; rowIndex: number }[] {
  const sorted = [...executives].sort((a, b) => {
    const tierDiff = getTier(a.position) - getTier(b.position);
    if (tierDiff !== 0) return tierDiff;
    return a.order - b.order;
  });

  const rows: { row: Executive[]; rowIndex: number }[] = [];
  let i = 0;
  let rowSize = 1;
  let rowIndex = 0;

  while (i < sorted.length) {
    rows.push({ row: sorted.slice(i, i + rowSize), rowIndex });
    i += rowSize;
    rowIndex++;
    // Pyramid: 1 → 2 → 3 → 4, then stay at 4 for overflow
    if (rowSize < 4) rowSize++;
  }

  return rows;
}

/* ─── Executive Card ───────────────────────────────────────── */

function ExecCard({ exec, rowIndex }: { exec: Executive; rowIndex: number }) {
  const initials = exec.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
  const meta = ROW_META[Math.min(rowIndex, ROW_META.length - 1)];
  const classLabel = exec.classOf
    ? exec.classOf.toLowerCase().startsWith('class')
      ? exec.classOf
      : `Class of ${exec.classOf}`
    : undefined;

  return (
    <LeadershipProfileCard
      name={exec.name}
      position={exec.position}
      photoUrl={exec.photoUrl}
      initials={initials}
      tier={Math.min(rowIndex, 3)}
      label={meta.label}
      subtitle={classLabel}
    />
  );
}

/* ─── Connector lines between rows ────────────────────────── */

function RowConnector({ fromCount, toCount }: { fromCount: number; toCount: number }) {
  return (
    <div className="flex justify-center py-1">
      <svg
        viewBox={`0 0 ${Math.max(fromCount, toCount) * 100} 40`}
        className="w-full max-w-3xl h-8 overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Vertical trunk from center top */}
        <motion.line
          x1="50%" y1="0" x2="50%" y2="20"
          stroke="url(#connGrad)" strokeWidth="1.5" strokeLinecap="round"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.3 }}
        />
        {/* Fan-out lines to each child position */}
        {Array.from({ length: toCount }).map((_, i) => {
          const totalWidth = Math.max(fromCount, toCount) * 100;
          const spacing = totalWidth / (toCount + 1);
          const childX = spacing * (i + 1);
          return (
            <motion.line
              key={i}
              x1="50%" y1="20" x2={childX} y2="40"
              stroke="url(#connGrad)" strokeWidth="1.5" strokeLinecap="round"
              initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }}
              viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
            />
          );
        })}
        <defs>
          <linearGradient id="connGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.12 250)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="oklch(0.55 0.12 250)" stopOpacity="0.08" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ─── Row label ───────────────────────────────────────────── */

const ROW_META: { icon: typeof Crown; label: string; labelClass: string; iconClass: string }[] = [
  { icon: Crown, label: 'Leadership', labelClass: 'text-secondary', iconClass: 'bg-gradient-to-br from-secondary to-secondary/80 text-secondary-content shadow-sm shadow-secondary/20' },
  { icon: Shield, label: 'Core Executive', labelClass: 'text-primary', iconClass: 'bg-primary/10 text-primary' },
  { icon: Star, label: 'Officers', labelClass: 'text-primary/70', iconClass: 'bg-primary/8 text-primary/70' },
  { icon: Star, label: 'Committee & Chapter Leads', labelClass: 'text-base-content/40', iconClass: 'bg-base-300/60 text-base-content/50' },
];

/* ─── Main Hierarchy Component ────────────────────────────── */

export default function ExecutiveHierarchy({ executives }: Props) {
  const pyramidRows = buildPyramidRows(executives);

  return (
    <div className="space-y-1">
      {pyramidRows.map(({ row, rowIndex }, i) => {
        const meta = ROW_META[Math.min(rowIndex, ROW_META.length - 1)];
        const RowIcon = meta.icon;
        const nextRow = pyramidRows[i + 1];

        // Grid width narrows for top rows to form the pyramid
        const gridClass =
          row.length === 1
            ? 'flex justify-center'
            : row.length === 2
            ? 'grid grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto gap-5'
            : row.length === 3
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto gap-5'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';

        const cardWidth =
          row.length === 1
            ? 'w-full max-w-xs'
            : '';

        return (
          <div key={rowIndex}>
            {/* Row label */}
            <motion.div
              className="flex items-center justify-center gap-2 mb-4"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
            >
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-l from-base-300 to-transparent" />
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta.iconClass}`}>
                <RowIcon size={13} />
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${meta.labelClass}`}>
                {meta.label}
              </span>
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-base-300 to-transparent" />
            </motion.div>

            {/* Cards */}
            <div className={gridClass}>
              {row.map((exec) => (
                <div key={exec.id} className={cardWidth}>
                  <ExecCard exec={exec} rowIndex={rowIndex} />
                </div>
              ))}
            </div>

            {/* Connector to next row */}
            {nextRow && <RowConnector fromCount={row.length} toCount={nextRow.row.length} />}
          </div>
        );
      })}
    </div>
  );
}
