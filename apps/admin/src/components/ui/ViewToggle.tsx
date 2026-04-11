import { LayoutGrid, List } from 'lucide-react'

export type ViewMode = 'table' | 'grid'

interface ViewToggleProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-0.5">
      <button
        onClick={() => onChange('table')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          view === 'table'
            ? 'bg-brand-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
      >
        <List size={14} />
        Table
      </button>
      <button
        onClick={() => onChange('grid')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          view === 'grid'
            ? 'bg-brand-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
      >
        <LayoutGrid size={14} />
        Grid
      </button>
    </div>
  )
}
