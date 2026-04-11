import { Link } from 'react-router'
import { Home, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { Layout } from '../components/layout/Layout'

/* ─── Animated SVG Doodles ─────────────────────────────────── */
function AnimatedDoodles() {
  return (
    <svg viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xl mx-auto">
      {/* School building outline */}
      <motion.g
        transform="translate(175, 60)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/20"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M0 90 L0 22 L70 0 L140 22 L140 90" />
        <path d="M70 0 L70 -18" />
        <path d="M70 -18 L92 -12 L70 -6" fill="currentColor" fillOpacity="0.1" />
        <rect x="18" y="38" width="18" height="18" rx="1.5" opacity="0.5" />
        <rect x="104" y="38" width="18" height="18" rx="1.5" opacity="0.5" />
        <path d="M56 90 L56 60 Q70 52, 84 60 L84 90" />
        <path d="M63 70 L77 80 M77 70 L63 80" strokeWidth="1.5" opacity="0.4" />
      </motion.g>

      {/* Leaves / nature doodles */}
      <motion.g
        stroke="currentColor" strokeWidth="1.2" fill="none" className="text-secondary/30"
        animate={{ rotate: [0, 5, -5, 0], y: [0, -3, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      >
        <path d="M40 100 Q46 88, 58 94 Q52 100, 58 112 Q46 106, 40 100Z" />
        <path d="M49 92 L46 108" strokeWidth="0.8" />
        <path d="M430 120 Q436 108, 448 114 Q442 120, 448 132 Q436 126, 430 120Z" />
        <path d="M439 112 L436 128" strokeWidth="0.8" />
      </motion.g>

      {/* Wandering dotted path */}
      <motion.path
        d="M20 220 Q75 198, 140 218 Q205 238, 270 212 Q335 186, 400 215 Q440 228, 480 215"
        stroke="currentColor" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round" fill="none"
        className="text-base-content/12"
        animate={{ strokeDashoffset: [0, -40] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      {/* Confused compass spinning */}
      <motion.g
        transform="translate(55, 175)" stroke="currentColor" strokeWidth="1.5" className="text-primary/25"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="0" cy="0" r="20" fill="none" />
        <path d="M0 -14 L4 0 L0 3 L-4 0Z" fill="currentColor" fillOpacity="0.2" />
        <path d="M0 14 L4 0 L0 -3 L-4 0Z" fill="currentColor" fillOpacity="0.4" />
        <circle cx="0" cy="0" r="2.5" fill="currentColor" fillOpacity="0.3" />
      </motion.g>

      {/* Binoculars */}
      <motion.g
        transform="translate(400, 180)" stroke="currentColor" strokeWidth="1.5" className="text-base-content/20"
        animate={{ x: [0, 5, -3, 0], y: [0, -2, 2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <circle cx="-10" cy="0" r="12" fill="none" />
        <circle cx="14" cy="0" r="12" fill="none" />
        <path d="M-2 -4 L8 -4" strokeWidth="2.5" />
        <circle cx="-10" cy="0" r="6" fill="none" opacity="0.4" />
        <circle cx="14" cy="0" r="6" fill="none" opacity="0.4" />
      </motion.g>

      {/* Question marks */}
      <motion.g
        className="text-secondary/30" fill="currentColor" fontSize="24" fontFamily="serif" fontStyle="italic"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <text x="22" y="80" opacity="0.5">?</text>
        <text x="455" y="80" opacity="0.4" fontSize="20">?</text>
      </motion.g>

      {/* Sparkles */}
      <motion.g
        fill="currentColor" className="text-secondary/30"
        animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M95 45 L97 37 L99 45 L107 47 L99 49 L97 57 L95 49 L87 47Z" />
        <path d="M385 45 L387 39 L389 45 L395 47 L389 49 L387 55 L385 49 L379 47Z" />
      </motion.g>
      <motion.g
        fill="currentColor" className="text-primary/20"
        animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      >
        <path d="M245 265 L247 258 L249 265 L256 267 L249 269 L247 276 L245 269 L238 267Z" />
      </motion.g>

      {/* Squiggly underline */}
      <motion.path
        d="M130 280 Q155 274, 180 280 Q205 286, 230 280 Q255 274, 280 280 Q305 286, 330 280 Q355 274, 380 280"
        stroke="currentColor" strokeWidth="1.5" fill="none" className="text-base-content/10"
        animate={{ opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  )
}

export default function NotFoundPage() {
  return (
    <Layout>
      <div className="relative min-h-[80vh] flex flex-col items-center justify-center text-center px-4 pt-24 pb-16 overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#001B50]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-56 h-56 bg-[#1E3A8A]/5 rounded-full blur-2xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <AnimatedDoodles />
        </motion.div>

        <motion.div
          className="relative z-10 mt-4"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
        >
          <h1 className="text-8xl font-black bg-gradient-to-br from-[#001B50] via-[#002870] to-[#1E3A8A] bg-clip-text text-transparent mb-2">
            404
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-10"
        >
          <h2 className="text-xl font-semibold text-base-content mb-2">Page not found</h2>
          <p className="text-base-content/50 text-sm max-w-sm mb-8">
            This page seems to have wandered off campus. Let's get you back to familiar grounds.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="relative z-10 flex flex-wrap gap-3 justify-center"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#001B50] via-[#002870] to-[#1E3A8A] text-white font-medium text-sm shadow-lg shadow-[#001B50]/20 hover:shadow-xl hover:shadow-[#001B50]/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97] border-none"
          >
            <Home className="w-4 h-4" /> Back to Home
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B8962D] text-white font-medium text-sm shadow-lg shadow-[#D4AF37]/20 hover:shadow-xl hover:shadow-[#D4AF37]/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97] border-none"
          >
            <Mail className="w-4 h-4" /> Contact Us
          </Link>
        </motion.div>
      </div>
    </Layout>
  )
}
