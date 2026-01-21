import { createFileRoute, useNavigate } from '@tanstack/react-router'

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
  '/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/$roomNumber/edit',
)({
  component: RoomEditComponent,
  pendingComponent: PendingComponent,
  errorComponent: ResourceErrorComponent,
})

function RoomEditComponent() {
  const { storeNumber, branchNumber, roomNumber } = Route.useParams()
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
        initialData={DUMMY_ROOM}
        storeNumber={storeNumber}
        branchNumber={branchNumber}
        roomNumber={roomNumber}
        onSubmit={(data) => {
          console.log('Update room:', data)
          // Dummy navigation back to room view
          navigate({
            to: '/stores/$storeNumber/branches/$branchNumber/rooms/$roomNumber',
            params: { storeNumber, branchNumber, roomNumber },
          })
        }}
      />
    </div>
  )
}
