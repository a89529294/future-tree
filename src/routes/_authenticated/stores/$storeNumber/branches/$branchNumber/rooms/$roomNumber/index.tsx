import { createFileRoute } from '@tanstack/react-router'

import { PendingComponent } from '@/components/pending-component'
import { ResourceErrorComponent } from '@/components/resource-error-component'
import { RoomForm } from '@/routes/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/-components/room-form'

// Dummy data fetching - in real app this would use a hook
const DUMMY_ROOM = {
  id: 'RM-00001',
  name: 'Room 101',
  description: 'Standard room with basic amenities',
  status: 'active' as const,
  storeNumber: 'ST-001',
  branchNumber: 'BR-001',
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const Route = createFileRoute(
  '/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/$roomNumber/',
)({
  component: RoomViewComponent,
  pendingComponent: PendingComponent,
  errorComponent: ResourceErrorComponent,
})

function RoomViewComponent() {
  const { storeNumber, branchNumber, roomNumber } = Route.useParams()

  return (
    <div className="space-y-6 bg-slate-900 h-full p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          檢視房間
        </h1>
      </div>

      <RoomForm
        mode="view"
        initialData={DUMMY_ROOM}
        storeNumber={storeNumber}
        branchNumber={branchNumber}
        roomNumber={roomNumber}
      />
    </div>
  )
}
