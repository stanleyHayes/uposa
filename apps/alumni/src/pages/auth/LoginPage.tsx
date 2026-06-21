import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MessageSquare,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi } from '../../api/services'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../hooks/useToast'
import SEO from '../../components/common/SEO'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

const features = [
  { icon: Users, label: 'Directory', detail: 'Find classmates and year groups' },
  { icon: MessageSquare, label: 'Forum', detail: 'Keep the conversation moving' },
  { icon: Wallet, label: 'Dues', detail: 'Track dues and giving records' },
  { icon: CalendarDays, label: 'Events', detail: 'See gatherings and reminders' },
]

const stats = [
  { label: 'Portal lanes', value: '08' },
  { label: 'Member desk', value: '24/7' },
  { label: 'School link', value: 'UP' },
]

const accessNotes = [
  { icon: ShieldCheck, label: 'Protected member access' },
  { icon: BadgeCheck, label: 'Verified alumni records' },
  { icon: BookOpen, label: 'School updates in one place' },
]

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const toast = useToast()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await authApi.login(data)
      setAuth(res.data.data.token, res.data.data.refreshToken ?? null, res.data.data.member)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid credentials'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO title="Sign In" description="Sign in to your UPOSA alumni account to access the member portal." />
      <div className="min-h-screen bg-base-100 text-base-content">
        <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)]">
          <section className="relative flex min-h-[44vh] overflow-hidden bg-primary px-5 py-8 text-primary-content sm:px-8 lg:min-h-screen lg:px-12 lg:py-10">
              <img
                src="/logo.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -left-20 top-12 h-72 w-72 object-contain opacity-[0.035] sm:h-96 sm:w-96 lg:-left-24 lg:top-20"
              />
              <img
                src="/logo.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 object-contain opacity-[0.045] sm:h-[30rem] sm:w-[30rem] lg:-right-20"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent"
              />

              <div className="relative z-10 flex w-full flex-col justify-between gap-10">
                <div className="flex items-center justify-between gap-4">
                  <Link to="/" className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center bg-base-100 p-1.5 shadow-lg shadow-black/10">
                      <img src="/logo.png" alt="UPOSA" className="h-full w-full object-contain" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold leading-tight">UPOSA Alumni</span>
                      <span className="block text-xs text-primary-content/55">The Legit Elites</span>
                    </span>
                  </Link>
                  <span className="hidden border border-primary-content/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-secondary sm:inline-flex">
                    Member portal
                  </span>
                </div>

                <div className="max-w-3xl">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="mb-5 inline-flex items-center gap-2 border border-primary-content/15 bg-primary-content/10 px-3 py-2 text-xs font-semibold text-primary-content/70"
                  >
                    <Sparkles className="h-4 w-4 text-secondary" />
                    Association desk
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="max-w-2xl text-4xl font-bold leading-[0.95] sm:text-5xl lg:text-6xl"
                  >
                    Return to the old students network.
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mt-5 max-w-xl text-base leading-relaxed text-primary-content/62 sm:text-lg"
                  >
                    Access dues, updates, mentorship, projects, and year-group conversations from one calm portal.
                  </motion.p>
                </div>

                <div className="space-y-6">
                  <div className="grid gap-px overflow-hidden border border-primary-content/10 bg-primary-content/10 sm:grid-cols-3">
                    {stats.map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18 + index * 0.06 }}
                        className="bg-primary/65 px-5 py-4"
                      >
                        <p className="text-2xl font-bold text-secondary">{stat.value}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary-content/45">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {features.map((feature, index) => (
                      <motion.div
                        key={feature.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.06 }}
                        className="group flex min-h-24 items-start gap-4 border border-primary-content/10 bg-primary-content/[0.06] p-4 transition-colors hover:bg-primary-content/[0.09]"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center bg-secondary text-primary transition-transform duration-300 group-hover:-rotate-3">
                          <feature.icon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block font-bold leading-tight">{feature.label}</span>
                          <span className="mt-1 block text-sm leading-snug text-primary-content/50">{feature.detail}</span>
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base-100 px-5 py-16 sm:px-8 lg:px-12">
              <img
                src="/logo.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 top-20 h-80 w-80 object-contain opacity-[0.035]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent"
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-[520px]"
              >
                <div className="mb-7 flex items-center gap-3 lg:hidden">
                  <span className="grid h-11 w-11 place-items-center bg-primary p-1.5">
                    <img src="/logo.png" alt="UPOSA" className="h-full w-full bg-base-100 object-contain" />
                  </span>
                  <div>
                    <span className="block font-bold leading-tight">UPOSA Alumni</span>
                    <span className="text-xs text-base-content/45">Member sign in</span>
                  </div>
                </div>

                <div className="overflow-hidden border border-primary/10 bg-base-100/95 shadow-[0_22px_80px_rgba(0,27,80,0.12)] backdrop-blur rounded-[20px_4px_20px_4px]">
                  <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
                  <div className="p-6 sm:p-8">
                    <div className="mb-8 flex items-start justify-between gap-6">
                      <div>
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-secondary">Secure entry</p>
                        <h2 className="text-3xl font-bold leading-tight sm:text-4xl">Sign in</h2>
                        <p className="mt-3 max-w-sm text-sm leading-relaxed text-base-content/55">
                          Use your alumni account to continue to the portal.
                        </p>
                      </div>
                      <span className="hidden h-12 w-12 shrink-0 place-items-center bg-primary/8 text-primary sm:grid">
                        <Network className="h-6 w-6" />
                      </span>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                      <div className="form-control">
                        <label className="label pb-1.5">
                          <span className="label-text text-sm font-semibold text-base-content/80">Email address</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/35" />
                          <input
                            type="email"
                            className={`input input-bordered h-12 w-full border-base-300 bg-base-200/45 pl-12 text-base-content transition-colors focus:border-primary focus:bg-base-100 ${errors.email ? 'input-error' : ''}`}
                            placeholder="alumni@uposa.org"
                            aria-invalid={Boolean(errors.email)}
                            {...register('email')}
                          />
                        </div>
                        <AnimatePresence>
                          {errors.email && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="mt-1.5 text-xs text-error"
                            >
                              {errors.email.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="form-control">
                        <div className="label pb-1.5">
                          <label htmlFor="password" className="label-text text-sm font-semibold text-base-content/80">
                            Password
                          </label>
                          <Link to="/forgot-password" className="text-xs font-semibold text-primary/60 transition-colors hover:text-primary">
                            Forgot?
                          </Link>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/35" />
                          <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            className={`input input-bordered h-12 w-full border-base-300 bg-base-200/45 pl-12 pr-12 text-base-content transition-colors focus:border-primary focus:bg-base-100 ${errors.password ? 'input-error' : ''}`}
                            placeholder="Enter your password"
                            aria-invalid={Boolean(errors.password)}
                            {...register('password')}
                          />
                          <button
                            type="button"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-3.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-base-content/35 transition-colors hover:text-base-content"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <AnimatePresence>
                          {errors.password && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="mt-1.5 text-xs text-error"
                            >
                              {errors.password.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <motion.button
                        type="submit"
                        className="btn btn-primary h-12 w-full justify-between px-5 text-base"
                        disabled={loading}
                        whileHover={{ scale: loading ? 1 : 1.01 }}
                        whileTap={{ scale: loading ? 1 : 0.97 }}
                      >
                        {loading ? (
                          <span className="flex w-full items-center justify-between gap-4">
                            <span>Securing session</span>
                            <span className="flex items-center gap-1.5" aria-hidden="true">
                              {[0, 1, 2].map((dot) => (
                                <motion.span
                                  key={dot}
                                  className="h-2 w-2 bg-primary-content/70"
                                  animate={{ opacity: [0.35, 1, 0.35] }}
                                  transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.12 }}
                                />
                              ))}
                            </span>
                          </span>
                        ) : (
                          <>
                            Enter portal <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </motion.button>
                    </form>

                    <div className="mt-7 grid gap-2 sm:grid-cols-3">
                      {accessNotes.map((note) => (
                        <div key={note.label} className="flex items-center gap-2 border border-primary/8 bg-base-200/35 px-3 py-2 text-xs font-semibold text-base-content/55">
                          <note.icon className="h-4 w-4 shrink-0 text-secondary" />
                          <span>{note.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-primary/8 bg-base-200/45 px-6 py-5 text-center text-sm text-base-content/55 sm:px-8">
                    New to the portal?{' '}
                    <Link to="/register" className="inline-flex items-center gap-1 font-bold text-primary transition-colors hover:text-accent">
                      Create your account <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </section>
          </div>
        </div>
      </>
    )
  }
