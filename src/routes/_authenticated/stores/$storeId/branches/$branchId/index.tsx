import { createFileRoute } from '@tanstack/react-router'
import { useDeferredValue } from 'react'

import { PendingComponent } from '@/components/pending-component'
import { ResourceErrorComponent } from '@/components/resource-error-component'
import { useBranch } from '@/queries/branches'
import { BranchForm } from '@/routes/_authenticated/stores/$storeId/branches/-components/branch-form'

export const Route = createFileRoute(
  '/_authenticated/stores/$storeId/branches/$branchId/',
)({
  component: BranchDetailComponent,
  pendingComponent: PendingComponent,
  errorComponent: ResourceErrorComponent,
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
