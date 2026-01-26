import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { PendingComponent } from '@/components/pending-component'
import { ResourceErrorComponent } from '@/components/resource-error-component'
import { useBranch } from '@/queries/branches'
import { roomsQueryKeys, useCreateRoom } from '@/queries/rooms'
import { RoomForm } from '@/routes/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/-components/room-form'

export const Route = createFileRoute(
  '/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/create',
)({
  component: RoomNewComponent,
  pendingComponent: PendingComponent,
  errorComponent: ResourceErrorComponent,
})

function RoomNewComponent() {
  const { storeNumber, branchNumber } = Route.useParams()
  const { data: branch } = useBranch(branchNumber)
  const { mutateAsync: createRoom } = useCreateRoom()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return (
    <div className="space-y-6 bg-slate-900 h-full p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          建立房間
        </h1>
      </div>

      <RoomForm
        mode="new"
        storeNumber={storeNumber}
        branchNumber={branchNumber}
        onSubmit={async (data) => {
          try {
            await createRoom({
              data: {
                ...data,
                branchId: branch.id,
                storeId: branch.storeId,
              },
            })

            toast.success('建立房間成功')
            queryClient.invalidateQueries({
              queryKey: roomsQueryKeys.branch(branchNumber),
            })
            navigate({
              to: '/stores/$storeNumber/branches/$branchNumber',
              params: { storeNumber, branchNumber },
              search: { tab: 'rooms' },
            })
          } catch (error) {
            const message = error instanceof Error ? error.message : '未知錯誤'
            toast.error(`建立房間失敗: ${message}`)
          }
        }}
      />
    </div>
  )
}
