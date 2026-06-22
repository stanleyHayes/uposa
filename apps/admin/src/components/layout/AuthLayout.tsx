import { type ReactNode } from 'react'
import { HandCoins, Newspaper, ShieldCheck, Users } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

const features = [
  { icon: Users, label: 'Members', text: 'Registrations, profiles, chapters' },
  { icon: HandCoins, label: 'Finance', text: 'Dues, donations, payment rails' },
  { icon: Newspaper, label: 'Updates', text: 'News, events, projects, gallery' },
  { icon: ShieldCheck, label: 'Access', text: 'Roles, permissions, audit trails' },
]

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 dark:bg-dark-bg dark:text-gray-100">
      <div className="grid min-h-screen lg:grid-cols-[minmax(420px,0.92fr)_1.08fr]">
        <aside className="relative hidden overflow-hidden bg-brand-950 text-cream-100 lg:flex">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'linear-gradient(90deg, rgba(255,248,220,.72) 1px, transparent 1px), linear-gradient(rgba(255,248,220,.72) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 top-20 h-[520px] w-[520px] object-contain opacity-[0.045]"
          />
          <div className="relative z-10 flex min-h-full w-full flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center border border-cream-100/10 bg-cream-100/10">
                <img src="/logo.png" alt="UPOSA" className="h-10 w-10 object-contain" />
              </span>
              <div>
                <p className="text-lg font-black tracking-tight text-white">UPOSA</p>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cream-100/40">Admin Portal</p>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 border border-cream-100/10 bg-cream-100/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cream-300">
                <ShieldCheck size={15} />
                Secretariat console
              </div>
              <h1 className="max-w-md text-4xl font-black leading-[1.02] tracking-tight text-white xl:text-5xl">
                Keep the association desk moving.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-cream-100/[0.58]">
                A focused workspace for the people publishing updates, reviewing members, tracking dues, and coordinating school support.
              </p>

              <div className="mt-9 grid gap-3">
                {features.map(({ icon: Icon, label, text }) => (
                  <div key={label} className="grid grid-cols-[44px_1fr] items-center gap-4 border border-cream-100/10 bg-cream-100/[0.055] p-3">
                    <span className="grid h-11 w-11 place-items-center bg-cream-100/10 text-cream-300">
                      <Icon size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-white">{label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-cream-100/[0.45]">{text}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 border border-cream-100/10 bg-cream-100/[0.045]">
              {[
                ['24/7', 'Desk'],
                ['RBAC', 'Access'],
                ['Live', 'Updates'],
              ].map(([value, label]) => (
                <div key={label} className="border-r border-cream-100/10 p-4 last:border-r-0">
                  <p className="text-lg font-black text-cream-300">{value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cream-100/[0.35]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="relative flex min-h-screen flex-col overflow-hidden bg-cream-50 dark:bg-dark-bg">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.045] dark:opacity-[0.035]"
            style={{
              backgroundImage: 'linear-gradient(90deg, rgba(0,27,80,.42) 1px, transparent 1px), linear-gradient(rgba(0,27,80,.42) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 bottom-8 h-[380px] w-[380px] object-contain opacity-[0.035] dark:opacity-[0.03]"
          />

          <div className="relative z-10 border-b border-brand-950/10 bg-cream-50/80 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-dark-bg/80 lg:hidden">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center border border-brand-950/10 bg-white dark:border-white/10 dark:bg-dark-card">
                <img src="/logo.png" alt="UPOSA" className="h-8 w-8 object-contain" />
              </span>
              <div>
                <p className="text-sm font-black text-brand-950 dark:text-white">UPOSA</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-500">Admin Portal</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
            <div className="w-full max-w-[480px]">
              <div className="mb-4 inline-flex items-center gap-2 border border-brand-950/10 bg-white/80 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-800 shadow-sm dark:border-white/10 dark:bg-dark-card/80 dark:text-cream-200">
                <ShieldCheck size={14} />
                Admin access
              </div>

              <section className="border border-brand-950/10 bg-white/[0.92] p-6 shadow-[0_22px_70px_rgba(0,27,80,0.13)] backdrop-blur dark:border-white/10 dark:bg-dark-card/95 dark:shadow-black/25 sm:p-8">
                {(title || subtitle) && (
                  <div className="mb-7">
                    {title && (
                      <h2 className="text-3xl font-black leading-tight tracking-tight text-brand-950 dark:text-gray-50">
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                        {subtitle}
                      </p>
                    )}
                  </div>
                )}

                {children}
              </section>

              <p className="mt-6 text-center text-xs font-medium text-gray-400 dark:text-gray-600">
                UPOSA Admin Dashboard. Contact your administrator for access.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
