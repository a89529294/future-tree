import { createFileRoute } from '@tanstack/react-router'
import { useDeferredValue } from 'react'

import { Spinner } from '@/components/ui/spinner'
import { branchQueryOptions, useBranch } from '@/queries/branches'
import { BranchForm } from '@/routes/_authenticated/stores/$storeId/branches/-components/branch-form'

export const Route = createFileRoute(
  '/_authenticated/stores/$storeId/branches/$branchId/',
)({
  loader: ({ params, context }) => {
    context.queryClient.ensureQueryData(branchQueryOptions(params.branchId))
  },
  component: BranchDetailComponent,
  pendingComponent: () => (
    <div className="h-full grid place-items-center">
      <Spinner className="size-8" />
    </div>
  ),
})

function BranchDetailComponent() {
  const { storeId, branchId } = Route.useParams()
  const deferredBranchId = useDeferredValue(branchId)
  const { data: branch } = useBranch(deferredBranchId)

  return (
    <div className="space-y-6 bg-slate-900 h-full p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">檢視據點</h1>
      </div>

      <div
        className={
          branchId !== deferredBranchId ? 'opacity-50 transition-opacity' : ''
        }
      >
        <BranchForm
          key={branch.id}
          initialData={branch}
          mode={'view'}
          storeId={storeId}
          branchId={branchId}
        />
      </div>
    </div>
  )
}
