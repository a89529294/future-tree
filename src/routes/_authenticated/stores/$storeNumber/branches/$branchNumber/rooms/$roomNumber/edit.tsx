import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { PendingComponent } from '@/components/pending-component'
import { ResourceErrorComponent } from '@/components/resource-error-component'
import { roomsQueryKeys, useRoom, useUpdateRoom } from '@/queries/rooms'
import { RoomForm } from '@/routes/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/-components/room-form'

export const Route = createFileRoute(
  '/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/$roomNumber/edit',
)({
  component: RoomEditComponent,
  pendingComponent: PendingComponent,
  errorComponent: ResourceErrorComponent,
})

function RoomEditComponent() {
  const { storeNumber, branchNumber, roomNumber } = Route.useParams()
  const { data } = useRoom(roomNumber)
  const { mutateAsync: updateRoom } = useUpdateRoom()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return (
    <div className="space-y-6 bg-slate-900 h-full p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          編輯房間
        </h1>
      </div>

      <RoomForm
        mode="edit"
        initialData={data}
        storeNumber={storeNumber}
        branchNumber={branchNumber}
        roomNumber={roomNumber}
        onSubmit={async (updateData) => {
          try {
            await updateRoom({
              data: {
                ...updateData,
                roomNumber,
              },
            })

            toast.success('更新房間成功')
            queryClient.invalidateQueries({
              queryKey: roomsQueryKeys.branch(branchNumber),
            })
            queryClient.invalidateQueries({
              queryKey: roomsQueryKeys.room(roomNumber),
            })
            navigate({
              to: '/stores/$storeNumber/branches/$branchNumber/rooms/$roomNumber',
              params: { storeNumber, branchNumber, roomNumber },
            })
          } catch (error) {
            const message = error instanceof Error ? error.message : '未知錯誤'
            toast.error(`更新房間失敗: ${message}`)
          }
        }}
      />
    </div>
  )
}
