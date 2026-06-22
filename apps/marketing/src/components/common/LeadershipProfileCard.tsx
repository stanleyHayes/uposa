import { motion } from 'framer-motion';
import { ArrowUpRight, Crown, Shield, Sparkles, Star } from 'lucide-react';

interface LeadershipProfileCardProps {
  name: string;
  position: string;
  photoUrl?: string | null;
  initials: string;
  tier: number;
  label: string;
  subtitle?: string;
}

function tierTone(tier: number) {
  if (tier === 0) {
    return {
      Icon: Crown,
      accent: 'bg-secondary',
      border: 'border-secondary/35',
      media: 'from-secondary/18 via-base-100 to-primary/6',
      tile: 'bg-secondary text-secondary-content',
      label: 'bg-secondary text-secondary-content',
    };
  }

  if (tier === 1) {
    return {
      Icon: Shield,
      accent: 'bg-primary',
      border: 'border-primary/18',
      media: 'from-primary/12 via-base-100 to-secondary/8',
      tile: 'bg-primary text-primary-content',
      label: 'bg-primary text-primary-content',
    };
  }

  if (tier === 2) {
    return {
      Icon: Star,
      accent: 'bg-accent',
      border: 'border-primary/14',
      media: 'from-accent/10 via-base-100 to-secondary/8',
      tile: 'bg-accent/18 text-base-content',
      label: 'bg-accent/14 text-base-content',
    };
  }

  return {
    Icon: Sparkles,
    accent: 'bg-base-300',
    border: 'border-primary/10',
    media: 'from-base-200 via-base-100 to-secondary/6',
    tile: 'bg-base-200 text-base-content/70',
    label: 'bg-base-200 text-base-content/75',
  };
}

export default function LeadershipProfileCard({
  name,
  position,
  photoUrl,
  initials,
  tier,
  label,
  subtitle,
}: LeadershipProfileCardProps) {
  const isTop = tier === 0;
  const { Icon, accent, border, media, tile, label: labelTone } = tierTone(tier);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group/card relative flex h-full min-h-[360px] flex-col overflow-hidden border bg-base-100 shadow-[0_14px_40px_rgba(0,27,80,0.07)] transition-shadow hover:shadow-[0_22px_56px_rgba(0,27,80,0.12)] ${border}`}
    >
      <div className={`h-1.5 ${accent}`} />

      <div className="relative p-4 pb-0">
        <div className={`relative aspect-[6/5] overflow-hidden border border-base-content/10 bg-gradient-to-br ${media}`}>
          <Icon className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 text-base-content/[0.04]" />

          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              loading="lazy"
              className="h-full w-full object-cover object-top transition-transform duration-500 group-hover/card:scale-[1.035]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className={`${isTop ? 'text-6xl' : 'text-5xl'} font-bold leading-none text-base-content/24`}>
                {initials}
              </span>
            </div>
          )}

          <div className="absolute left-3 top-3 flex items-center gap-2 border border-base-100/55 bg-base-100/86 px-2.5 py-1.5 shadow-sm backdrop-blur">
            <span className={`grid h-6 w-6 place-items-center ${tile}`}>
              <Icon size={12} />
            </span>
            <span className="font-status text-[10px] font-bold uppercase tracking-[0.16em] text-base-content">
              {label}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className={`${isTop ? 'text-xl' : 'text-lg'} font-bold leading-tight text-base-content`}>
              {name}
            </h3>
            {subtitle && (
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-base-content/38">
                {subtitle}
              </p>
            )}
          </div>
          <span className={`grid h-10 w-10 shrink-0 place-items-center ${tile}`}>
            <Icon size={17} />
          </span>
        </div>

        <div className={`mt-5 inline-flex w-fit items-center px-3 py-2 text-sm font-bold leading-tight ${labelTone}`}>
          {position}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-base-content/10 pt-5 text-sm font-bold text-base-content">
          <span>Leadership profile</span>
          <ArrowUpRight size={17} className="text-base-content/30 transition-transform group-hover/card:-translate-y-0.5 group-hover/card:translate-x-0.5 group-hover/card:text-secondary" />
        </div>
      </div>
    </motion.article>
  );
}
