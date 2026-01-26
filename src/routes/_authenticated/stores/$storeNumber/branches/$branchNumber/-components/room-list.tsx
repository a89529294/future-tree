import { useNavigate } from '@tanstack/react-router'
import { Suspense } from 'react'

import { PendingComponent } from '@/components/pending-component'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useRooms } from '@/queries/rooms'
import { CreateNewRoomBtn } from '@/routes/_authenticated/stores/$storeNumber/branches/$branchNumber/-components/create-new-room-btn'

import { Route } from '../index'

export function RoomList() {
  const { storeNumber, branchNumber } = Route.useParams()

  const navigate = Route.useNavigate()

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateNewRoomBtn
          storeNumber={storeNumber}
          branchNumber={branchNumber}
        />
      </div>
      <Suspense fallback={<PendingComponent className="py-4" />}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InnerRoomList
            branchNumber={branchNumber}
            storeNumber={storeNumber}
          />
        </div>
      </Suspense>
    </div>
  )
}

function InnerRoomList({
  branchNumber,
  storeNumber,
}: {
  branchNumber: string
  storeNumber: string
}) {
  const { data } = useRooms(branchNumber)
  const navigate = useNavigate({
    from: '/stores/$storeNumber/branches/$branchNumber/',
  })

  return data.map((room) => (
    <Card
      key={room.id}
      className="bg-slate-900 border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
      onClick={() => {
        navigate({
          to: '/stores/$storeNumber/branches/$branchNumber/rooms/$roomNumber',
          params: {
            storeNumber,
            branchNumber,
            roomNumber: room.roomNumber,
          },
        })
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-100">
          {room.name}
        </CardTitle>
        <Badge
          variant={room.status === 'active' ? 'default' : 'secondary'}
          className={
            room.status === 'active'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
          }
        >
          {room.status === 'active' ? '使用中' : '未使用'}
        </Badge>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-slate-400">
          {room.description || '無描述'}
        </CardDescription>
      </CardContent>
    </Card>
  ))
}
