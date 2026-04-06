import { motion } from 'framer-motion'

function FloatingShape({ delay, x, y, size, color }: { delay: number; x: string; y: string; size: number; color: string }) {
  return (
    <motion.div
      className="absolute rounded-full opacity-20 blur-sm"
      style={{ left: x, top: y, width: size, height: size, background: color }}
      animate={{ y: [0, -18, 0], x: [0, 8, 0], scale: [1, 1.08, 1] }}
      transition={{ duration: 6, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  )
}

function GridPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  )
}

export function GraduationCapIllustration() {
  return (
    <motion.svg
      width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {/* Graduation Cap */}
      <motion.path
        d="M140 60 L40 110 L140 160 L240 110 Z"
        fill="currentColor" className="text-primary-content/90"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      />
      <motion.path
        d="M140 60 L40 110 L140 160 L240 110 Z"
        stroke="currentColor" className="text-secondary" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, delay: 0.2 }}
      />
      {/* Cap top */}
      <motion.rect
        x="100" y="42" width="80" height="18" rx="4"
        fill="currentColor" className="text-primary-content/80"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      />
      {/* Tassel */}
      <motion.g
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <line x1="200" y1="88" x2="230" y2="130" stroke="currentColor" className="text-secondary" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="232" cy="134" r="6" fill="currentColor" className="text-secondary" />
        <motion.line
          x1="230" y1="134" x2="230" y2="160" stroke="currentColor" className="text-secondary" strokeWidth="2" strokeLinecap="round"
          animate={{ y2: [160, 155, 160] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.g>
      {/* Podium */}
      <motion.path
        d="M90 160 L90 200 L190 200 L190 160"
        stroke="currentColor" className="text-primary-content/40" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
      />
      {/* Stars */}
      {[{ cx: 60, cy: 80, d: 0.4 }, { cx: 220, cy: 70, d: 0.6 }, { cx: 45, cy: 150, d: 0.8 }, { cx: 235, cy: 170, d: 1 }].map((s, i) => (
        <motion.circle
          key={i} cx={s.cx} cy={s.cy} r="2"
          fill="currentColor" className="text-secondary"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
          transition={{ duration: 2.5, delay: s.d + 1, repeat: Infinity, repeatDelay: 1 }}
        />
      ))}
      {/* Connection lines */}
      <motion.path
        d="M60 200 Q140 220 220 200"
        stroke="currentColor" className="text-primary-content/20" strokeWidth="1" fill="none" strokeDasharray="4 4"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 1.2 }}
      />
    </motion.svg>
  )
}

export function NetworkIllustration() {
  return (
    <motion.svg
      width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
    >
      {/* Network nodes */}
      {[
        { cx: 140, cy: 100, r: 18, delay: 0.2 },
        { cx: 80, cy: 160, r: 14, delay: 0.4 },
        { cx: 200, cy: 160, r: 14, delay: 0.5 },
        { cx: 60, cy: 220, r: 10, delay: 0.6 },
        { cx: 140, cy: 230, r: 12, delay: 0.7 },
        { cx: 220, cy: 220, r: 10, delay: 0.8 },
      ].map((n, i) => (
        <motion.g key={i}>
          <motion.line
            x1={140} y1={100}
            x2={n.cx} y2={n.cy}
            stroke="currentColor" className="text-secondary/40" strokeWidth="1"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: n.delay }}
          />
          <motion.circle
            cx={n.cx} cy={n.cy} r={n.r}
            className="text-primary-content/40"
            fill="rgba(255,255,255,0.15)"
            stroke="currentColor" strokeWidth="1.5"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: n.delay, type: 'spring' }}
          />
          <motion.circle
            cx={n.cx} cy={n.cy} r={n.r * 0.5}
            fill="currentColor" className="text-secondary/60"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: n.delay + 0.2 }}
          />
        </motion.g>
      ))}
      {/* Extra connections */}
      {[[80, 160, 60, 220], [80, 160, 140, 230], [200, 160, 220, 220], [200, 160, 140, 230]].map((l, i) => (
        <motion.line
          key={`l${i}`} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]}
          stroke="currentColor" className="text-primary-content/20" strokeWidth="1"
          strokeDasharray="3 3"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.8 + i * 0.1 }}
        />
      ))}
      {/* Pulse ring on main node */}
      <motion.circle
        cx={140} cy={100} r={18}
        fill="none" stroke="currentColor" className="text-secondary/30"
        animate={{ r: [18, 30, 18], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  )
}

export function MailIllustration() {
  return (
    <motion.svg
      width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Envelope body */}
      <motion.rect
        x="30" y="60" width="140" height="100" rx="8"
        className="text-primary-content/40"
        fill="rgba(255,255,255,0.1)"
        stroke="currentColor" strokeWidth="2"
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      {/* Envelope flap */}
      <motion.path
        d="M30 68 L100 115 L170 68"
        stroke="currentColor" className="text-secondary" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
      {/* Letter lines */}
      {[80, 92, 104].map((y, i) => (
        <motion.line
          key={i} x1="55" y1={y} x2={i === 2 ? 110 : 145} y2={y}
          stroke="currentColor" className="text-primary-content/25" strokeWidth="2" strokeLinecap="round"
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
        />
      ))}
      {/* Floating sparkles */}
      <motion.circle
        cx="155" cy="50" r="3" fill="currentColor" className="text-secondary"
        animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
      <motion.circle
        cx="45" cy="45" r="2" fill="currentColor" className="text-secondary/60"
        animate={{ y: [0, -6, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
      />
    </motion.svg>
  )
}

export function ShieldIllustration() {
  return (
    <motion.svg
      width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Shield */}
      <motion.path
        d="M100 30 L40 60 L40 110 Q40 160 100 180 Q160 160 160 110 L160 60 Z"
        className="text-primary-content/40"
        fill="rgba(255,255,255,0.1)"
        stroke="currentColor" strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      {/* Checkmark */}
      <motion.path
        d="M75 105 L95 125 L130 80"
        stroke="currentColor" className="text-secondary" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      />
      {/* Glow ring */}
      <motion.circle
        cx={100} cy={105} r={50}
        fill="none" stroke="currentColor" className="text-secondary/20"
        animate={{ r: [50, 60, 50], opacity: [0.2, 0, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.svg>
  )
}

interface AuthPanelProps {
  title: string
  subtitle: string
  illustration: React.ReactNode
  features?: string[]
}

export default function AuthSidePanel({ title, subtitle, illustration, features }: AuthPanelProps) {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-content overflow-hidden">
      <GridPattern />

      {/* Floating decorative shapes */}
      <FloatingShape delay={0} x="10%" y="15%" size={80} color="rgba(212,175,55,0.15)" />
      <FloatingShape delay={1.5} x="70%" y="10%" size={120} color="rgba(255,255,255,0.08)" />
      <FloatingShape delay={3} x="80%" y="70%" size={90} color="rgba(212,175,55,0.12)" />
      <FloatingShape delay={0.8} x="5%" y="75%" size={60} color="rgba(255,255,255,0.06)" />
      <FloatingShape delay={2} x="50%" y="85%" size={100} color="rgba(212,175,55,0.1)" />

      <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-2"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/20">
            <span className="text-2xl font-black">U</span>
          </div>
        </motion.div>

        {/* Illustration */}
        <div className="my-6">
          {illustration}
        </div>

        {/* Text */}
        <motion.h2
          className="text-3xl font-bold mb-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {title}
        </motion.h2>
        <motion.p
          className="text-primary-content/70 max-w-sm text-sm leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {subtitle}
        </motion.p>

        {/* Feature list */}
        {features && features.length > 0 && (
          <motion.div
            className="mt-8 space-y-3 text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 text-sm text-primary-content/80"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.7 + i * 0.1 }}
              >
                <div className="w-5 h-5 rounded-full bg-secondary/30 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {feature}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Bottom decorative dots */}
        <motion.div
          className="flex gap-2 mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-secondary/40"
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}
