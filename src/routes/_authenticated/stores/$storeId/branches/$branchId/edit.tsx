import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDeferredValue } from 'react'

import { PendingComponent } from '@/components/pending-component'
import { ResourceErrorComponent } from '@/components/resource-error-component'
import { useBranch, useUpdateBranch } from '@/queries/branches'

import { BranchForm } from '../-components/branch-form'

export const Route = createFileRoute(
  '/_authenticated/stores/$storeId/branches/$branchId/edit',
)({
  component: BranchEditComponent,
  pendingComponent: PendingComponent,
  errorComponent: ResourceErrorComponent,
})

function BranchEditComponent() {
  const { storeId, branchId } = Route.useParams()
  const deferredBranchId = useDeferredValue(branchId)
  const { data: branch } = useBranch(deferredBranchId)
  const updateBranch = useUpdateBranch()
  const navigate = useNavigate()

  return (
    <div className="space-y-6 bg-slate-900 h-full p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">編輯據點</h1>
      </div>

      <div
        className={
          branchId !== deferredBranchId ? 'opacity-50 transition-opacity' : ''
        }
      >
        <BranchForm
          key={branch.id}
          initialData={branch}
          mode={'edit'}
          storeId={storeId}
          branchId={branchId}
          onSubmit={async (data) => {
            await updateBranch.mutateAsync({
              data: { branchId: branchId, ...data },
            })
            navigate({
              to: '/stores/$storeId/branches/$branchId',
              params: { storeId, branchId },
            })
          }}
        />
      </div>
    </div>
  )
}
