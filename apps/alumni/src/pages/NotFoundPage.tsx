import { Link, useNavigate } from 'react-router'
import { Home, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

/* ─── Animated SVG Doodles ─────────────────────────────────── */
function AnimatedDoodles() {
  return (
    <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-lg mx-auto">
      {/* Graduation cap floating */}
      <motion.g
        transform="translate(220, 45)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary/30"
        animate={{ y: [0, -8, 0], rotate: [0, -3, 3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M-35 12 L0 -5 L35 12 L0 28Z" />
        <path d="M0 -5 L0 -20" />
        <rect x="-4" y="-25" width="8" height="7" rx="1.5" />
        <path d="M-45 3 Q-40 -2, -35 3" strokeWidth="1.5" opacity="0.5" />
        <path d="M35 3 Q40 -2, 45 3" strokeWidth="1.5" opacity="0.5" />
      </motion.g>

      {/* Open book with blank pages */}
      <motion.g
        transform="translate(210, 190)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-base-content/20"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <path d="M0 0 Q-35 -10, -60 0 L-60 40 Q-35 30, 0 40Z" />
        <path d="M0 0 Q35 -10, 60 0 L60 40 Q35 30, 0 40Z" />
        <path d="M0 0 L0 40" />
        <path d="M-48 12 L-10 9" strokeDasharray="3 4" opacity="0.4" />
        <path d="M-45 22 L-12 19" strokeDasharray="3 4" opacity="0.4" />
        <path d="M10 9 L48 12" strokeDasharray="3 4" opacity="0.4" />
        <path d="M12 19 L45 22" strokeDasharray="3 4" opacity="0.4" />
      </motion.g>

      {/* Floating question marks */}
      <motion.g
        className="text-secondary/40" fill="currentColor" fontSize="22" fontFamily="serif" fontStyle="italic"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
      >
        <text x="60" y="85" opacity="0.6">?</text>
        <text x="390" y="105" opacity="0.4" fontSize="30">?</text>
        <text x="40" y="210" opacity="0.3" fontSize="18">?</text>
        <text x="420" y="200" opacity="0.5" fontSize="20">?</text>
      </motion.g>

      {/* Paper airplane */}
      <motion.g
        transform="translate(370, 55)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary/25"
        animate={{ x: [0, 15, 0], y: [0, -10, 0], rotate: [15, 10, 20, 15] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M0 0 L30 12 L10 14Z" />
        <path d="M10 14 L15 8" />
        <path d="M-5 5 Q-15 8, -25 5 Q-35 2, -45 6" strokeDasharray="3 4" strokeWidth="1" opacity="0.5" />
      </motion.g>

      {/* Animated sparkles */}
      <motion.g
        fill="currentColor" className="text-secondary/30"
        animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M110 55 L112 48 L114 55 L121 57 L114 59 L112 66 L110 59 L103 57Z" />
        <path d="M420 170 L422 164 L424 170 L430 172 L424 174 L422 180 L420 174 L414 172Z" />
      </motion.g>
      <motion.g
        fill="currentColor" className="text-primary/20"
        animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <path d="M250 260 L252 253 L254 260 L261 262 L254 264 L252 271 L250 264 L243 262Z" />
      </motion.g>

      {/* Scattered pencil shavings */}
      <motion.g
        stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" className="text-base-content/15"
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M80 140 Q85 133, 92 138 Q99 143, 106 138" />
        <path d="M350 150 Q355 143, 362 148 Q369 153, 376 148" />
        <path d="M140 260 Q145 253, 152 258" />
        <path d="M330 260 Q335 253, 342 258" />
      </motion.g>

      {/* Cobweb */}
      <motion.g
        stroke="currentColor" strokeWidth="0.8" className="text-base-content/10"
        animate={{ opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M0 0 L45 45" />
        <path d="M0 17 L34 45" />
        <path d="M0 34 L22 45" />
        <path d="M17 0 L45 28" />
        <path d="M6 6 Q16 14, 14 22" />
        <path d="M16 9 Q24 20, 22 30" />
      </motion.g>

      {/* Dotted trail going nowhere */}
      <motion.path
        d="M30 270 Q80 250, 130 265 Q180 280, 240 260 Q300 240, 360 258 Q400 268, 450 255"
        stroke="currentColor" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round" fill="none"
        className="text-base-content/12"
        animate={{ strokeDashoffset: [0, -40] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
    </svg>
  )
}

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-56 h-56 bg-accent/5 rounded-full blur-2xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <AnimatedDoodles />
      </motion.div>

      <motion.h1
        className="relative z-10 text-8xl font-black bg-gradient-to-br from-primary via-accent to-primary/60 bg-clip-text text-transparent mb-2 mt-4"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
      >
        404
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-10"
      >
        <h2 className="text-xl font-semibold mb-2">Page not found</h2>
        <p className="text-base-content/50 text-sm max-w-sm mb-8">
          Looks like this page graduated and moved on. Let's get you back on track.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="relative z-10 flex flex-wrap gap-3 justify-center"
      >
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary via-accent to-primary/80 text-primary-content font-medium text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]"
        >
          <Home className="w-4 h-4" /> Back to Dashboard
        </Link>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-base-300 text-base-content font-medium text-sm hover:bg-base-200 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </motion.div>
    </div>
  )
}
