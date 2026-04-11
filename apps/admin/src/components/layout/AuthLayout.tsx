import { type ReactNode } from 'react'
import { Shield, Users, BarChart3, Globe } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

const features = [
  { icon: Users, text: 'Manage alumni & members' },
  { icon: BarChart3, text: 'Track donations & dues' },
  { icon: Globe, text: 'Publish events & news' },
  { icon: Shield, text: 'Role-based access control' },
]

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left branded panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative bg-brand-950 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Gradient orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-cream-300/5 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          {/* Logo + branding */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <img src="/logo.png" alt="UPOSA" className="w-11 h-11 rounded-xl" />
              <span className="text-xl font-black text-white tracking-tight">UPOSA</span>
            </div>
            <p className="text-brand-300/70 text-sm ml-14">Admin Portal</p>
          </div>

          {/* Middle section */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
                Powering the alumni
                <br />
                <span className="text-cream-300">community.</span>
              </h2>
              <p className="mt-4 text-brand-200/60 text-sm leading-relaxed max-w-sm">
                Manage every aspect of the UPOSA alumni network from one centralized dashboard.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-3">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-brand-200/70">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-cream-300/80" />
                  </div>
                  <span className="text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-brand-300/30 text-xs">
            &copy; {new Date().getFullYear()} UPOSA. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-dark-bg">
        {/* Mobile header */}
        <div className="lg:hidden px-6 pt-8 pb-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="UPOSA" className="w-9 h-9 rounded-xl" />
            <span className="text-lg font-black text-brand-950 dark:text-white tracking-tight">UPOSA</span>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-8 sm:px-12">
          <div className="w-full max-w-[420px]">
            {/* Title area */}
            {(title || subtitle) && (
              <div className="mb-8">
                {title && (
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {children}

            {/* Bottom text */}
            <p className="mt-10 text-center text-xs text-gray-400 dark:text-gray-600">
              UPOSA Admin Dashboard &mdash; Contact your administrator for access.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
