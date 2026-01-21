import { Plus } from 'lucide-react'

import { RouterLink } from '@/components/router-link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Room } from '@/db/schemas/resources/rooms'

import { Route } from '../index'

const DUMMY_ROOMS: Array<Partial<Room>> = [
  {
    id: 'RM-00001',
    name: 'Room 101',
    description: 'Standard room with basic amenities',
    status: 'active',
  },
  {
    id: 'RM-00002',
    name: 'Room 102',
    description: 'Deluxe room with city view',
    status: 'active',
  },
  {
    id: 'RM-00003',
    name: 'Room 103',
    description: 'Under maintenance',
    status: 'inactive',
  },
]

export function RoomList() {
  const { storeNumber, branchNumber } = Route.useParams()
  const navigate = Route.useNavigate()

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <RouterLink
            to="/stores/$storeNumber/branches/$branchNumber/rooms/create"
            params={{ storeNumber, branchNumber }}
          >
            <Plus className="mr-2 h-4 w-4" />
            建立新房間
          </RouterLink>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DUMMY_ROOMS.map((room) => (
          <Card
            key={room.id}
            className="bg-slate-900 border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
            onClick={() => {
              navigate({
                to: '/stores/$storeNumber/branches/$branchNumber/rooms/$roomNumber',
                params: {
                  storeNumber,
                  branchNumber,
                  roomNumber: room.id!,
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
        ))}
      </div>
    </div>
  )
}
