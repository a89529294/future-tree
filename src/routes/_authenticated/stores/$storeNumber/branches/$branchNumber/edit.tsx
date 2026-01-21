import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDeferredValue } from 'react'

import { PendingComponent } from '@/components/pending-component'
import { ResourceErrorComponent } from '@/components/resource-error-component'
import { useBranch, useUpdateBranch } from '@/queries/branches'

import { BranchForm } from '../-components/branch-form'

export const Route = createFileRoute(
  '/_authenticated/stores/$storeNumber/branches/$branchNumber/edit',
)({
  component: BranchEditComponent,
  pendingComponent: PendingComponent,
  errorComponent: ResourceErrorComponent,
})

function BranchEditComponent() {
  const { storeNumber, branchNumber } = Route.useParams()
  const deferredBranchNumber = useDeferredValue(branchNumber)
  const { data: branch } = useBranch(deferredBranchNumber)
  const updateBranch = useUpdateBranch()
  const navigate = useNavigate()

  return (
    <div className="space-y-6 bg-slate-900 h-full p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">編輯店家</h1>
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
          mode={'edit'}
          storeNumber={storeNumber}
          branchNumber={branchNumber}
          onSubmit={async (data) => {
            await updateBranch.mutateAsync({
              data: { branchId: branchNumber, storeNumber, ...data },
            })
            navigate({
              to: '/stores/$storeNumber/branches/$branchNumber',
              params: { storeNumber, branchNumber },
              search: { tab: 'info' },
            })
          }}
        />
      </div>
    </div>
  )
}
