import { createFileRoute } from '@tanstack/react-router'

import { PendingComponent } from '@/components/pending-component'
import { ResourceErrorComponent } from '@/components/resource-error-component'
import { useRoom } from '@/queries/rooms'
import { CreateNewRoomBtn } from '@/routes/_authenticated/stores/$storeNumber/branches/$branchNumber/-components/create-new-room-btn'
import { RoomForm } from '@/routes/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/-components/room-form'

export const Route = createFileRoute(
  '/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/$roomNumber/',
)({
  component: RoomViewComponent,
  pendingComponent: PendingComponent,
  errorComponent: ResourceErrorComponent,
})

function RoomViewComponent() {
  const { storeNumber, branchNumber, roomNumber } = Route.useParams()
  const { data } = useRoom(roomNumber)

  return (
    <div className="space-y-6 bg-slate-900 h-full p-4">
      <div className="flex justify-between">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            檢視房間
          </h1>
        </div>
        <CreateNewRoomBtn
          storeNumber={storeNumber}
          branchNumber={branchNumber}
        />
      </div>

      <RoomForm
        mode="view"
        initialData={data}
        storeNumber={storeNumber}
        branchNumber={branchNumber}
        roomNumber={roomNumber}
      />
    </div>
  )
}
