interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingSpinner({ className = '' }: Props) {
  return (
    <div className={`space-y-4 animate-pulse ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-base-300/60" />
        <div className="space-y-1.5 flex-1">
          <div className="w-32 h-4 rounded bg-base-300/60" />
          <div className="w-20 h-3 rounded bg-base-300/40" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="w-full h-3 rounded bg-base-300/50" />
        <div className="w-4/5 h-3 rounded bg-base-300/40" />
        <div className="w-3/5 h-3 rounded bg-base-300/30" />
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="w-48 h-6 rounded-lg bg-base-300/60" />
          <div className="w-32 h-3 rounded bg-base-300/40" />
        </div>
        <div className="w-28 h-9 rounded-lg bg-base-300/50" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-base-300/50 p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-base-300/50" />
            <div className="w-16 h-6 rounded bg-base-300/60" />
            <div className="w-24 h-3 rounded bg-base-300/30" />
          </div>
        ))}
      </div>

      {/* Content cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-base-300/50 overflow-hidden">
            <div className="h-36 bg-base-300/40" />
            <div className="p-4 space-y-2">
              <div className="w-20 h-4 rounded-full bg-base-300/50" />
              <div className="w-3/4 h-4 rounded bg-base-300/60" />
              <div className="w-full h-3 rounded bg-base-300/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
