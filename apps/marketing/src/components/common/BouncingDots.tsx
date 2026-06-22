interface BouncingDotsProps {
  className?: string;
  label?: string;
}

/**
 * Inline three-dot bouncing loader. Uses `bg-current` so the dots inherit the
 * surrounding text/button color. Drop in as button content while an action is
 * in flight (replaces skeleton/spinner loaders).
 */
export function BouncingDots({ className = "", label = "Loading" }: BouncingDotsProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} role="status" aria-label={label}>
      <span className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
      <span className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
      <span className="h-2 w-2 rounded-full bg-current animate-bounce" />
    </span>
  );
}

export default BouncingDots;
