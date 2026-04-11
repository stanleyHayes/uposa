import { motion } from 'framer-motion';
import { Crown, Shield, Star } from 'lucide-react';
import { Card, CardAccent, CardBody } from '../ui/Card.tsx';

interface SchoolLeader {
  id?: string;
  name: string;
  position: string;
  photoUrl?: string | null;
  initials?: string;
  order?: number;
}

interface Props {
  leaders: SchoolLeader[];
}

/* ─── Tier classification by position keywords ────────────── */

function getTier(position: string): number {
  const lower = position.toLowerCase();

  // Tier 0: Head of school
  if (lower.includes('headmaster') || lower.includes('headmistress') || lower.includes('head of school') || lower.includes('principal')) return 0;

  // Tier 1: Assistants / Deputies
  if (lower.includes('assistant') || lower.includes('deputy') || lower.includes('vice')) return 1;

  // Tier 2: Senior positions / HODs
  if (lower.includes('senior') || lower.includes('head of department') || lower.includes('hod') || lower.includes('dean') || lower.includes('bursar') || lower.includes('chaplain') || lower.includes('imam') || lower.includes('guidance') || lower.includes('counselling')) return 2;

  // Tier 3: Housemasters, coordinators, other staff
  return 3;
}

function getTierMeta(tier: number) {
  switch (tier) {
    case 0: return { label: 'Head of School', icon: Crown, labelClass: 'text-secondary', iconClass: 'bg-gradient-to-br from-secondary to-secondary/80 text-secondary-content shadow-sm shadow-secondary/20' };
    case 1: return { label: 'Assistant Heads', icon: Shield, labelClass: 'text-primary', iconClass: 'bg-primary/10 text-primary' };
    case 2: return { label: 'Senior Staff', icon: Star, labelClass: 'text-primary/70', iconClass: 'bg-primary/8 text-primary/70' };
    default: return { label: 'Staff', icon: Star, labelClass: 'text-base-content/40', iconClass: 'bg-base-300/60 text-base-content/50' };
  }
}

/* ─── Leader Card ──────────────────────────────────────────── */

function LeaderCard({ leader, tier }: { leader: SchoolLeader; tier: number }) {
  const initials = leader.initials || leader.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
  const isTop = tier === 0;
  const isUpper = tier <= 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="h-full">
        <CardAccent color={isTop ? 'secondary' : isUpper ? 'primary' : 'accent'} />
        <CardBody className={`items-center text-center flex flex-col ${isTop ? 'py-8' : 'py-5'}`}>
          {/* Avatar */}
          <div className={`relative mb-3 ${isTop ? 'ring-3 ring-secondary/20 ring-offset-2 ring-offset-base-100' : ''} rounded-full`}>
            {leader.photoUrl ? (
              <div className="avatar">
                <div className={`${isTop ? 'w-24' : isUpper ? 'w-18' : 'w-16'} rounded-full overflow-hidden`}>
                  <img src={leader.photoUrl} alt={leader.name} loading="lazy" className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <div className="avatar placeholder">
                <div className={`bg-gradient-to-br ${isTop ? 'from-secondary to-secondary/80 text-secondary-content w-24' : isUpper ? 'from-primary to-accent text-primary-content w-18' : 'from-primary/80 to-primary text-primary-content w-16'} rounded-full`}>
                  <span className={`${isTop ? 'text-2xl' : isUpper ? 'text-xl' : 'text-lg'} font-bold`}>{initials}</span>
                </div>
              </div>
            )}
            {isTop && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shadow-md shadow-secondary/30 border-2 border-base-100">
                <Crown size={12} className="text-secondary-content" />
              </div>
            )}
          </div>

          <h3 className={`font-bold ${isTop ? 'text-lg' : 'text-base'}`}>{leader.name}</h3>
          <div
            className={`inline-block rounded-lg px-3 py-1 text-sm font-medium mt-1.5 ${
              isTop
                ? 'bg-gradient-to-r from-secondary to-secondary/80 text-secondary-content shadow-sm'
                : isUpper
                ? 'bg-primary/10 text-primary'
                : 'bg-base-200 text-base-content/70'
            }`}
          >
            {leader.position}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}

/* ─── Connector ───────────────────────────────────────────── */

function TierConnector() {
  return (
    <div className="flex justify-center py-1">
      <motion.div
        className="w-0.5 h-8 bg-gradient-to-b from-primary/15 to-primary/5"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        style={{ transformOrigin: 'top' }}
      />
    </div>
  );
}

/* ─── Build pyramid rows: 1 → 2 → 3 → 4 ─────────────────── */

function buildRows(leaders: SchoolLeader[]): { row: SchoolLeader[]; rowIndex: number }[] {
  const sorted = [...leaders].sort((a, b) => {
    const tierDiff = getTier(a.position) - getTier(b.position);
    if (tierDiff !== 0) return tierDiff;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const rows: { row: SchoolLeader[]; rowIndex: number }[] = [];
  let i = 0;
  let rowSize = 1;
  let rowIndex = 0;

  while (i < sorted.length) {
    rows.push({ row: sorted.slice(i, i + rowSize), rowIndex });
    i += rowSize;
    rowIndex++;
    if (rowSize < 4) rowSize++;
  }

  return rows;
}

/* ─── Main Component ──────────────────────────────────────── */

export default function SchoolLeadershipHierarchy({ leaders }: Props) {
  const rows = buildRows(leaders);

  return (
    <div className="space-y-1">
      {rows.map(({ row, rowIndex }, i) => {
        const meta = getTierMeta(Math.min(rowIndex, 3));
        const TierIcon = meta.icon;
        const nextRow = rows[i + 1];

        const gridClass =
          row.length === 1
            ? 'flex justify-center'
            : row.length === 2
            ? 'grid grid-cols-2 max-w-2xl mx-auto gap-5'
            : row.length === 3
            ? 'grid grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto gap-5'
            : 'grid grid-cols-2 lg:grid-cols-4 gap-4';

        const cardWidth = row.length === 1 ? 'w-full max-w-xs' : '';

        return (
          <div key={rowIndex}>
            {/* Tier label */}
            <motion.div
              className="flex items-center justify-center gap-2 mb-4"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
            >
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-l from-base-300 to-transparent" />
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta.iconClass}`}>
                <TierIcon size={13} />
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${meta.labelClass}`}>
                {meta.label}
              </span>
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-base-300 to-transparent" />
            </motion.div>

            {/* Cards */}
            <div className={gridClass}>
              {row.map((leader) => (
                <div key={leader.id || leader.name} className={cardWidth}>
                  <LeaderCard leader={leader} tier={Math.min(rowIndex, 3)} />
                </div>
              ))}
            </div>

            {/* Connector */}
            {nextRow && <TierConnector />}
          </div>
        );
      })}
    </div>
  );
}
