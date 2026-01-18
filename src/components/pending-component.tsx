import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export function PendingComponent({ className }: { className?: string }) {
  return (
    <div className={cn('h-full grid place-items-center', className)}>
      <Spinner className="size-8" />
    </div>
  )
}
