/**
 * Full-screen branded splash shown while a route's chunk and its initial data
 * load (Suspense fallback + per-page loading gate). Replaces the old skeleton
 * mock, which felt slow/broken on API cold-start. Visually matches the static
 * splash in index.html for a seamless hand-off from first paint.
 */
export default function SplashScreen() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-7 bg-[#0a1633] text-center">
      <img
        src="/logo.png"
        alt="UPOSA"
        className="h-24 w-24 object-contain animate-pulse drop-shadow-[0_12px_34px_rgba(0,0,0,0.5)]"
      />
      <div>
        <div
          className="text-[40px] font-bold leading-none tracking-[2px] text-[#faf7ef]"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          UPOSA
        </div>
        <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.32em] text-[#e3b341]">
          The Legit Elites
        </div>
      </div>
      <span className="mt-1 inline-flex items-center gap-2" role="status" aria-label="Loading">
        <span className="h-2.5 w-2.5 rounded-full bg-[#e3b341] animate-bounce [animation-delay:-0.3s]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e3b341] animate-bounce [animation-delay:-0.15s]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e3b341] animate-bounce" />
      </span>
    </div>
  );
}
