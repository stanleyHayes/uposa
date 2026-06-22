import { LayoutGrid, List } from 'lucide-react'

export type ViewMode = 'table' | 'grid'

interface ViewToggleProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex border border-brand-950/10 bg-cream-100/70 p-0.5 dark:border-dark-border dark:bg-dark-card">
      <button
        onClick={() => onChange('table')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all ${
          view === 'table'
            ? 'bg-brand-950 text-cream-100 shadow-sm dark:bg-cream-100 dark:text-brand-950'
            : 'text-brand-950/50 hover:text-brand-950 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
      >
        <List size={14} />
        Table
      </button>
      <button
        onClick={() => onChange('grid')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all ${
          view === 'grid'
            ? 'bg-brand-950 text-cream-100 shadow-sm dark:bg-cream-100 dark:text-brand-950'
            : 'text-brand-950/50 hover:text-brand-950 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
      >
        <LayoutGrid size={14} />
        Grid
      </button>
    </div>
  )
}
