import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

/* ─── Animated SVG Doodles ─────────────────────────────────── */
function AnimatedDoodles() {
  return (
    <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-lg mx-auto">
      {/* Crumpled paper */}
      <motion.g
        stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"
        animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M60 70 L105 64 L110 104 L65 110Z" strokeDasharray="4 3" />
        <path d="M75 80 L95 78" />
        <path d="M73 88 L97 86" />
        <path d="M71 96 L93 94" />
      </motion.g>

      {/* Broken pencil */}
      <motion.g
        stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0.6"
        animate={{ y: [0, -4, 0], rotate: [0, -2, 2, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <path d="M350 55 L380 85" />
        <path d="M380 85 L383 88" strokeWidth="1.5" />
        <path d="M390 75 L410 95" />
        <path d="M410 95 L412 99" fill="#D4AF37" strokeWidth="1" />
      </motion.g>

      {/* Magnifying glass */}
      <motion.g
        transform="translate(220, 80)" stroke="#94a3b8" strokeWidth="2.5" opacity="0.45"
        animate={{ x: [0, 8, -4, 0], y: [0, -3, 3, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      >
        <circle cx="0" cy="0" r="24" fill="none" />
        <line x1="17" y1="17" x2="35" y2="35" strokeWidth="3.5" strokeLinecap="round" />
        <text x="-7" y="6" fontSize="18" fill="#94a3b8" stroke="none" fontFamily="serif">?</text>
      </motion.g>

      {/* Squiggly lines */}
      <motion.g
        stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35"
        animate={{ pathLength: [0.8, 1, 0.8], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M30 200 Q55 188, 70 205 Q85 222, 110 210" />
        <path d="M370 200 Q395 188, 410 205 Q425 222, 450 210" />
      </motion.g>

      {/* Animated sparkles */}
      <motion.g
        fill="#D4AF37" opacity="0.5"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M40 140 L43 130 L46 140 L56 143 L46 146 L43 156 L40 146 L30 143Z" />
        <path d="M430 140 L432 134 L434 140 L440 142 L434 144 L432 150 L430 144 L424 142Z" />
      </motion.g>
      <motion.g
        fill="#001B50" opacity="0.2"
        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <path d="M240 270 L242 264 L244 270 L250 272 L244 274 L242 280 L240 274 L234 272Z" />
      </motion.g>

      {/* Compass spinning */}
      <motion.g
        transform="translate(400, 240)" stroke="#94a3b8" strokeWidth="1.5" opacity="0.45"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="0" cy="0" r="18" fill="none" />
        <path d="M0 -12 L3 0 L0 2 L-3 0Z" fill="#cbd5e1" stroke="none" />
        <path d="M0 12 L3 0 L0 -2 L-3 0Z" fill="#94a3b8" stroke="none" />
        <circle cx="0" cy="0" r="2" fill="#94a3b8" />
      </motion.g>

      {/* Dotted trail */}
      <motion.path
        d="M50 260 Q100 240, 150 255 Q200 270, 250 250 Q300 230, 350 248 Q400 260, 440 245"
        stroke="#d1d5db" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round" fill="none" opacity="0.35"
        animate={{ strokeDashoffset: [0, -40] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      {/* Folded map */}
      <motion.g
        transform="translate(55, 220)" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"
        animate={{ rotate: [0, -3, 3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <path d="M0 0 L15 -5 L30 0 L45 -5" fill="none" />
        <path d="M0 0 L0 30 L15 25 L30 30 L45 25 L45 -5" fill="none" />
        <path d="M15 -5 L15 25" strokeDasharray="2 3" />
        <path d="M30 0 L30 30" strokeDasharray="2 3" />
      </motion.g>
    </svg>
  )
}

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-100/20 dark:bg-brand-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-amber-100/15 dark:bg-amber-900/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-56 h-56 bg-brand-50/20 dark:bg-brand-950/10 rounded-full blur-2xl" />
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
        className="relative z-10 text-8xl font-black bg-gradient-to-br from-brand-900 via-brand-600 to-brand-400 dark:from-brand-200 dark:via-brand-400 dark:to-brand-600 bg-clip-text text-transparent mb-2 mt-4"
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
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Lost in the archives</h2>
        <p className="text-gray-400 dark:text-gray-500 text-sm max-w-sm mb-8">
          This page seems to have wandered off. It might have been moved, renamed, or never existed at all.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="relative z-10 flex flex-wrap gap-3 justify-center"
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white font-medium text-sm shadow-lg shadow-brand-900/25 hover:shadow-xl hover:shadow-brand-900/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]"
        >
          <Home size={16} /> Back to Dashboard
        </button>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-dark-hover hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </motion.div>
    </div>
  )
}
