export default function SplashScreen() {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Navbar skeleton */}
      <div className="h-16 bg-primary/90">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/10 animate-pulse" />
            <div className="w-20 h-4 rounded bg-white/10 animate-pulse hidden sm:block" />
          </div>
          <div className="hidden lg:flex items-center gap-4">
            {[56, 48, 64, 40, 52].map((w, i) => (
              <div key={i} className="h-3 rounded bg-white/10 animate-pulse" style={{ width: w, animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-white/10 animate-pulse" />
            <div className="w-20 h-9 rounded-lg bg-white/10 animate-pulse hidden sm:block" />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="bg-gradient-to-br from-primary via-primary/95 to-accent py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="w-44 h-8 rounded-full bg-white/8 animate-pulse mb-6" />
          <div className="w-[70%] max-w-lg h-10 rounded-lg bg-white/10 animate-pulse mb-3" />
          <div className="w-[45%] max-w-sm h-10 rounded-lg bg-white/8 animate-pulse mb-5" />
          <div className="w-[60%] max-w-md h-5 rounded bg-white/5 animate-pulse mb-8" />
          <div className="flex gap-3">
            <div className="w-28 h-11 rounded-xl bg-white/10 animate-pulse" />
            <div className="w-28 h-11 rounded-xl bg-white/7 animate-pulse" style={{ animationDelay: '100ms' }} />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-14">
        {/* Section header */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-36 h-7 rounded-full bg-base-300/70 animate-pulse mb-4" />
          <div className="w-56 h-7 rounded-lg bg-base-300 animate-pulse mb-2" />
          <div className="w-44 h-4 rounded bg-base-300/50 animate-pulse" />
        </div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-base-300/60 overflow-hidden"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="h-44 bg-base-300/40 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              <div className="p-5 space-y-3">
                <div className="w-20 h-5 rounded-full bg-base-300/50 animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
                <div className="w-3/4 h-5 rounded bg-base-300/60 animate-pulse" style={{ animationDelay: `${i * 100 + 100}ms` }} />
                <div className="space-y-2">
                  <div className="w-full h-3 rounded bg-base-300/40 animate-pulse" style={{ animationDelay: `${i * 100 + 150}ms` }} />
                  <div className="w-2/3 h-3 rounded bg-base-300/30 animate-pulse" style={{ animationDelay: `${i * 100 + 200}ms` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
