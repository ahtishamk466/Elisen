import { Skeleton } from '@/components/ui/Skeleton'

export interface StatCardProps {
  value: number | string
  label: string
  loading?: boolean
}

export function StatCard({ value, label, loading = false }: StatCardProps) {
  return (
    <div className="rounded-sm border border-border-default bg-neutral-25 p-lg">
      {loading ? (
        <>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="mt-sm h-4 w-2/3" />
        </>
      ) : (
        <>
          <p className="text-3xl font-bold text-text-primary">{value}</p>
          <p className="mt-xs text-sm text-text-secondary">{label}</p>
        </>
      )}
    </div>
  )
}
