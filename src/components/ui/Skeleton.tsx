interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

export function Skeleton({ className = '', width, height, rounded = 'md' }: SkeletonProps) {
  const roundedClass = {
    sm: 'rounded-[var(--radius-sm)]',
    md: 'rounded-[var(--radius-md)]',
    lg: 'rounded-[var(--radius-lg)]',
    full: 'rounded-full',
  }

  return (
    <div
      className={`skeleton ${roundedClass[rounded]} ${className}`}
      style={{ width, height }}
    />
  )
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
          rounded="sm"
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-surface-1 border border-border rounded-[var(--radius-lg)] p-5 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton width={48} height={48} rounded="full" />
        <div className="flex-1 space-y-2">
          <Skeleton height={16} className="w-2/3" rounded="sm" />
          <Skeleton height={12} className="w-1/3" rounded="sm" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}

export function SkeletonTableRow({ cols = 5, className = '' }: { cols?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-4 px-4 py-3.5 ${className}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          className={i === 0 ? 'w-8' : i === 1 ? 'flex-1' : 'w-20'}
          rounded="sm"
        />
      ))}
    </div>
  )
}
