import { type ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 border-b border-brand-950/10 pb-5 dark:border-dark-border sm:flex-row sm:items-end">
      <div className="min-w-0">
        <div className="mb-2 inline-flex items-center gap-2 border border-cream-500/30 bg-cream-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-950/65 dark:border-white/10 dark:bg-white/[0.04] dark:text-cream-100/55">
          Secretariat desk
        </div>
        <h1 className="text-2xl font-black leading-tight tracking-tight text-brand-950 dark:text-gray-100 md:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-950/55 dark:text-gray-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
