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
import { branches } from '@/db/schemas'
import { machineFormSchema, machines } from '@/db/schemas/resources/machines'

export const createMachine = createServerFn({ method: 'POST' })
  .inputValidator(
    machineFormSchema.extend({
      branchNumber: z.string(),
    }),
  )
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'machines.create')

      const branch = await db.query.branches.findFirst({
        where: eq(branches.branchNumber, data.branchNumber),
      })
      if (!branch) {
        throw new NotFoundError('branch', data.branchNumber)
      }

      requireAccessBranch(user, branch)

      const { branchNumber, ...formData } = data

      // Insert with branch.id (UUID) for FK and denormalized storeId from branch
      const [newMachine] = await db
        .insert(machines)
        .values({
          ...formData,
          branchId: branch.id,
          storeId: branch.storeNumber,
        })
        .returning()

      return newMachine
    }, 'Create machine failed:'),
  )

export const readMachine = createServerFn()
  .inputValidator((data: { machineId: string; branchId: string }) => data)
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'machines.read')

      const branch = await db.query.branches.findFirst({
        where: eq(branches.branchNumber, data.branchId),
      })
      if (!branch) {
        throw new NotFoundError('branch', data.branchId)
      }

      requireAccessBranch(user, branch)

      const foundMachine = await db.query.machines.findFirst({
        where: eq(machines.id, data.machineId),
      })

      if (!foundMachine) throw new NotFoundError('machine', data.machineId)

      return foundMachine
    }, 'Read machine failed:'),
  )

export const readMachines = createServerFn()
  .inputValidator((branchId: string) => branchId)
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'machines.read')

      const branch = await db.query.branches.findFirst({
        where: eq(branches.branchNumber, data),
      })
      if (!branch) {
        throw new NotFoundError('branch', data)
      }

      requireAccessBranch(user, branch)

      return await db.query.machines.findMany({
        where: eq(machines.branchId, data),
      })
    }, 'Read machines failed:'),
  )

export const updateMachine = createServerFn({ method: 'POST' })
  .inputValidator(
    machineFormSchema.extend({
      machineId: z.string(),
      branchId: z.string(),
    }),
  )
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'machines.update')

      const branch = await db.query.branches.findFirst({
        where: eq(branches.branchNumber, data.branchId),
      })
      if (!branch) {
        throw new NotFoundError('branch', data.branchId)
      }

      requireAccessBranch(user, branch)

      const { machineId, branchId, ...updateData } = data

      const updatedMachines = await db
        .update(machines)
        .set(updateData)
        .where(eq(machines.id, machineId))
        .returning()

      if (updatedMachines.length === 0) {
        throw new NotFoundError('machine', machineId)
      }

      return updatedMachines[0]
    }, 'Update machine failed:'),
  )

export const deleteMachine = createServerFn({ method: 'POST' })
  .inputValidator((data: { machineId: string; branchId: string }) => data)
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'machines.delete')

      const branch = await db.query.branches.findFirst({
        where: eq(branches.branchNumber, data.branchId),
      })
      if (!branch) {
        throw new NotFoundError('branch', data.branchId)
      }

      requireAccessBranch(user, branch)

      const deletedMachines = await db
        .delete(machines)
        .where(eq(machines.id, data.machineId))
        .returning()

      if (deletedMachines.length === 0) {
        throw new NotFoundError('machine', data.machineId)
      }

      return deletedMachines[0]
    }, 'Delete machine failed:'),
  )

export const deleteMachines = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { machineIds: Array<string>; branchId: string }) => data,
  )
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'machines.delete')

      const branch = await db.query.branches.findFirst({
        where: eq(branches.branchNumber, data.branchId),
      })
      if (!branch) {
        throw new NotFoundError('branch', data.branchId)
      }

      requireAccessBranch(user, branch)

      const deletedMachines = await db
        .delete(machines)
        .where(inArray(machines.id, data.machineIds))
        .returning()

      return deletedMachines
    }, 'Delete machines failed:'),
  )
