import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useCreateBranch } from '@/queries/branches'

import { BranchForm } from './-components/branch-form'

export const Route = createFileRoute(
  '/_authenticated/stores/$storeId/branches/create',
)({
  component: BranchCreateComponent,
})

function BranchCreateComponent() {
  const { storeId } = Route.useParams()
  const createBranch = useCreateBranch()
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">建立據點</h1>
      </div>

      <BranchForm
        mode={'new'}
        initialData={{ storeId }}
        storeId={storeId}
        onSubmit={async (data) => {
          const result = await createBranch.mutateAsync({ data })
          navigate({
            to: '/stores/$storeId/branches/$branchId',
            params: { storeId, branchId: result.id },
          })
        }}
      />
    </div>
  )
}
