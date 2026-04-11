import { LayoutGrid, List } from 'lucide-react'

export type ViewMode = 'grid' | 'table'

interface ViewToggleProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="join border border-base-300">
      <button
        onClick={() => onChange('grid')}
        className={`join-item btn btn-sm ${view === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
      >
        <LayoutGrid size={14} />
      </button>
      <button
        onClick={() => onChange('table')}
        className={`join-item btn btn-sm ${view === 'table' ? 'btn-primary' : 'btn-ghost'}`}
      >
        <List size={14} />
      </button>
    </div>
  )
}
