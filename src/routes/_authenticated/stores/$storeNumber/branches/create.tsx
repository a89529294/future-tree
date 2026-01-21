import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { useCreateBranch } from '@/queries/branches'

import { BranchForm } from './-components/branch-form'

export const Route = createFileRoute(
  '/_authenticated/stores/$storeNumber/branches/create',
)({
  component: BranchCreateComponent,
})

function BranchCreateComponent() {
  const queryClient = useQueryClient()
  const { storeNumber } = Route.useParams()
  const createBranch = useCreateBranch()
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">建立店家</h1>
      </div>

      <BranchForm
        mode={'new'}
        storeNumber={storeNumber}
        onSubmit={(data) => {
          createBranch.mutateAsync(
            {
              data: { storeNumber, ...data },
            },
            {
              onSuccess({ name, branchNumber }) {
                toast.success(`成功新增 ${name}`)
                queryClient.invalidateQueries({ queryKey: ['branches'] })
                navigate({
                  to: '/stores/$storeNumber/branches/$branchNumber',
                  params: { storeNumber, branchNumber },
                  search: { tab: 'info' },
                })
              },
              onError(e) {
                toast.warning(e.message)
              },
            },
          )
        }}
      />
    </div>
  )
}
