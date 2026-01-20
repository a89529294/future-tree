import { createFileRoute } from '@tanstack/react-router'
import { useDeferredValue } from 'react'

import { PendingComponent } from '@/components/pending-component'
import { ResourceErrorComponent } from '@/components/resource-error-component'
import { useBranch } from '@/queries/branches'

import { BranchForm } from '../-components/branch-form'

export const Route = createFileRoute(
  '/_authenticated/stores/$storeNumber/branches/$branchNumber/',
)({
  component: BranchDetailComponent,
  pendingComponent: PendingComponent,
  errorComponent: ResourceErrorComponent,
})

function BranchDetailComponent() {
  const { storeNumber, branchNumber } = Route.useParams()
  const deferredBranchNumber = useDeferredValue(branchNumber)
  const { data: branch } = useBranch(deferredBranchNumber)

  return (
    <div className="space-y-6 bg-slate-900 h-full p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">檢視店家</h1>
      </div>

      <div
        className={
          branchNumber !== deferredBranchNumber
            ? 'opacity-50 transition-opacity'
            : ''
        }
      >
        <BranchForm
          key={branch.id}
          initialData={branch}
          mode={'view'}
          storeNumber={storeNumber}
          branchNumber={branchNumber}
        />
      </div>
    </div>
  )
}
