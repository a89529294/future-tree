import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { branchesQueryKeys, useCreateBranch } from '@/queries/branches'

import { BranchForm } from './-components/branch-form'

export const Route = createFileRoute(
  '/_authenticated/stores/$storeNumber/branches/create',
)({
  component: BranchCreateComponent,
})

function BranchCreateComponent() {
  const queryClient = useQueryClient()
  const { storeNumber } = Route.useParams()
  const { mutateAsync: createBranch } = useCreateBranch()
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">建立店家</h1>
      </div>

      <BranchForm
        mode={'new'}
        storeNumber={storeNumber}
        onSubmit={async (data) => {
          try {
            const { name, branchNumber } = await createBranch({
              data,
            })

            toast.success(`成功新增 ${name}`)
            queryClient.invalidateQueries({ queryKey: branchesQueryKeys.all })
            navigate({
              to: '/stores/$storeNumber/branches/$branchNumber',
              params: { storeNumber, branchNumber },
              search: { tab: 'info' },
            })
          } catch (error) {
            const message = error instanceof Error ? error.message : '未知錯誤'
            toast.warning(message)
          }
        }}
      />
    </div>
  )
}
