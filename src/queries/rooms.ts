import {
  mutationOptions,
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query'

import { createRoom, readRoom, readRooms, updateRoom } from '@/data/rooms'

export const roomsQueryKeys = {
  all: ['rooms'] as const,
  branches: () => [...roomsQueryKeys.all, 'branches'] as const,
  branch: (branchNumber: string) =>
    [...roomsQueryKeys.branches(), branchNumber] as const,
  room: (roomNumber: string) => [...roomsQueryKeys.all, roomNumber] as const,
}

export const roomsQueryOptions = (branchNumber: string) =>
  queryOptions({
    queryKey: roomsQueryKeys.branch(branchNumber),
    queryFn: () =>
      readRooms({
        data: {
          branchNumber,
        },
      }),
    enabled: !!branchNumber,
  })

export const roomQueryOptions = (roomNumber: string) =>
  queryOptions({
    queryKey: roomsQueryKeys.room(roomNumber),
    queryFn: () =>
      readRoom({
        data: {
          roomNumber,
        },
      }),
    enabled: !!roomNumber,
  })

export const roomMutationOptions = () =>
  mutationOptions({
    mutationFn: updateRoom,
  })

export const createRoomMutationOptions = () =>
  mutationOptions({
    mutationFn: createRoom,
  })

export const useRooms = (branchNumber: string) =>
  useSuspenseQuery(roomsQueryOptions(branchNumber))

export const useRoom = (roomNumber: string) =>
  useSuspenseQuery(roomQueryOptions(roomNumber))

export const useUpdateRoom = () => useMutation(roomMutationOptions())

export const useCreateRoom = () => useMutation(createRoomMutationOptions())
