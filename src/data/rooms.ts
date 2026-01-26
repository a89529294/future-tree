import { createServerFn } from '@tanstack/react-start'
import { eq, inArray } from 'drizzle-orm'
import z from 'zod'

import {
  NotFoundError,
  requireAccessBranch,
  requireAuth,
  requirePermission,
} from '@/data/utils/authorize'
import { withDbErrors } from '@/data/utils/db-error'
import { db } from '@/db'
import { branches } from '@/db/schemas/resources/branches'
import { roomFormSchema, rooms } from '@/db/schemas/resources/rooms'
import { sleep, withSleepInDev } from '@/utils'

const createRoom = createServerFn({ method: 'POST' })
  .inputValidator(
    roomFormSchema.extend({
      branchId: z.string(),
      storeId: z.string(),
    }),
  )
  .handler(
    withDbErrors(
      withSleepInDev(async ({ data }) => {
        const user = await requireAuth()
        requirePermission(user, 'rooms.create')

        const branch = await db.query.branches.findFirst({
          where: eq(branches.id, data.branchId),
        })
        if (!branch) {
          throw new NotFoundError('branch', data.branchId)
        }

        requireAccessBranch(user, branch)

        const [newRoom] = await db.insert(rooms).values(data).returning()

        return newRoom
      }),
      'Create room failed:',
    ),
  )

const readRoom = createServerFn()
  .inputValidator(({ roomNumber }: { roomNumber: string }) => roomNumber)
  .handler(
    withDbErrors(
      withSleepInDev(async ({ data }) => {
        const user = await requireAuth()
        requirePermission(user, 'rooms.read')

        const room = await db.query.rooms.findFirst({
          where: eq(rooms.roomNumber, data),
        })
        if (!room) {
          throw new NotFoundError('room', data)
        }

        const branch = await db.query.branches.findFirst({
          where: eq(branches.id, room.branchId),
        })
        if (!branch) {
          throw new NotFoundError('branch', room.branchId)
        }

        requireAccessBranch(user, branch)

        return room
      }),
      'Read room failed:',
    ),
  )

const readRooms = createServerFn()
  .inputValidator(
    z.object({
      branchNumber: z.string(),
    }),
  )
  .handler(
    withDbErrors(
      withSleepInDev(async ({ data }) => {
        const user = await requireAuth()
        requirePermission(user, 'rooms.read')

        const branch = await db.query.branches.findFirst({
          where: eq(branches.branchNumber, data.branchNumber),
        })
        if (!branch) {
          throw new NotFoundError('branch', data.branchNumber)
        }

        requireAccessBranch(user, branch)

        return await db.query.rooms.findMany({
          where: eq(rooms.branchId, branch.id),
        })
      }),
      'Read rooms failed:',
    ),
  )

const updateRoom = createServerFn({ method: 'POST' })
  .inputValidator(
    roomFormSchema.extend({
      roomNumber: z.string(),
    }),
  )
  .handler(
    withDbErrors(
      withSleepInDev(async ({ data }) => {
        const user = await requireAuth()
        requirePermission(user, 'rooms.update')

        const foundRoom = await db.query.rooms.findFirst({
          where: eq(rooms.roomNumber, data.roomNumber),
          with: {
            branch: true,
          },
        })

        if (!foundRoom) throw new NotFoundError('room', data.roomNumber)

        requireAccessBranch(user, foundRoom.branch)

        const { roomNumber, ...updatedData } = data

        const updatedRooms = await db
          .update(rooms)
          .set(updatedData)
          .where(eq(rooms.roomNumber, roomNumber))
          .returning()

        if (updatedRooms.length === 0) {
          throw new NotFoundError('room', data.roomNumber)
        }

        return updatedRooms[0]
      }),
      'Update room failed:',
    ),
  )

const deleteRoom = createServerFn({ method: 'POST' })
  .inputValidator((data: { roomId: string }) => data)
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'rooms.delete')

      const room = await db.query.rooms.findFirst({
        where: eq(rooms.id, data.roomId),
        with: {
          branch: true,
        },
      })
      if (!room) {
        throw new NotFoundError('room', data.roomId)
      }

      requireAccessBranch(user, room.branch)

      const deletedRooms = await db
        .delete(rooms)
        .where(eq(rooms.id, data.roomId))
        .returning()

      if (deletedRooms.length === 0) {
        throw new NotFoundError('room', data.roomId)
      }

      return deletedRooms[0]
    }, 'Delete room failed:'),
  )

const deleteRooms = createServerFn({ method: 'POST' })
  .inputValidator((data: { roomIds: Array<string> }) => data)
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'rooms.delete')

      const roomsToDelete = await db.query.rooms.findMany({
        where: inArray(rooms.id, data.roomIds),
        with: {
          branch: true,
        },
      })

      if (roomsToDelete.length === 0) {
        throw new NotFoundError('room', data.roomIds.join(', '))
      }

      for (const room of roomsToDelete) {
        requireAccessBranch(user, room.branch)
      }

      const deletedRooms = await db
        .delete(rooms)
        .where(inArray(rooms.id, data.roomIds))
        .returning()

      return deletedRooms
    }, 'Delete rooms failed:'),
  )

export { createRoom, deleteRoom, deleteRooms, readRoom, readRooms, updateRoom }
