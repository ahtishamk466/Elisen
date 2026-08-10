export interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden className={`animate-pulse rounded-sm bg-neutral-200 ${className}`} />
}
