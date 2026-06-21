interface SkeletonBlockProps {
    className?: string;
}

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
    return <span aria-hidden="true" className={`block animate-pulse bg-current/15 ${className}`} />;
}

export function SkeletonLines({ count = 3, className = "" }: { count?: number; className?: string }) {
    return (
        <div aria-hidden="true" className={`space-y-2 ${className}`}>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonBlock
                    key={index}
                    className={`h-3 ${index === count - 1 ? "w-2/3" : "w-full"}`}
                />
            ))}
        </div>
    );
}

export function SkeletonCardGrid({ count = 3, className = "" }: { count?: number; className?: string }) {
    return (
        <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="border border-primary/10 bg-base-100 p-5 shadow-sm">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <SkeletonBlock className="h-14 w-14 bg-primary/15" />
                        <SkeletonBlock className="h-7 w-20 bg-primary/10" />
                    </div>
                    <SkeletonBlock className="h-5 w-2/3 bg-primary/15" />
                    <SkeletonLines className="mt-4 text-primary" />
                    <SkeletonBlock className="mt-6 h-10 w-full bg-primary/10" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonRows({ count = 3, className = "" }: { count?: number; className?: string }) {
    return (
        <div className={`space-y-4 ${className}`}>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="border border-primary/10 bg-base-200 p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                        <SkeletonBlock className="h-12 w-12 bg-primary/15" />
                        <div className="min-w-0 flex-1">
                            <SkeletonBlock className="h-5 w-1/2 bg-primary/15" />
                            <SkeletonBlock className="mt-3 h-4 w-3/4 bg-primary/10" />
                            <SkeletonBlock className="mt-4 h-8 w-40 bg-primary/10" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
