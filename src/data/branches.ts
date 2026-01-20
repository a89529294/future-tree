import { createServerFn } from '@tanstack/react-start'
import { eq, inArray } from 'drizzle-orm'
import z from 'zod'

import {
  NotFoundError,
  requireAccessBranch,
  requireAccessStore,
  requireAuth,
  requirePermission,
} from '@/data/utils/authorize'
import { withDbErrors } from '@/data/utils/db-error'
import { db } from '@/db'
import { stores } from '@/db/schemas'
import { branches, branchFormSchema } from '@/db/schemas/resources/branches'
import { withSleepInDev } from '@/utils'

const createBranch = createServerFn({ method: 'POST' })
  .inputValidator(
    branchFormSchema.extend({
      storeNumber: z.string(),
    }),
  )
  .handler(
    withDbErrors(
      withSleepInDev(async ({ data }) => {
        const user = await requireAuth()
        requirePermission(user, 'branches.create')

        const store = await db.query.stores.findFirst({
          where: eq(stores.storeNumber, data.storeNumber),
        })
        if (!store) {
          throw new NotFoundError('store', data.storeNumber)
        }

        requireAccessStore(user, store)

        const [newBranch] = await db.insert(branches).values(data).returning()

        return newBranch
      }),
      'Create branch failed:',
    ),
  )

const readBranch = createServerFn()
  .inputValidator((branchId: string) => branchId)
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'branches.read')

      const branch = await db.query.branches.findFirst({
        where: eq(branches.branchNumber, data),
      })
      if (!branch) {
        throw new NotFoundError('branch', data)
      }

      requireAccessBranch(user, branch)

      return branch
    }, 'Read branch failed:'),
  )

const readBranches = createServerFn().handler(
  withDbErrors(
    withSleepInDev(async () => {
      const user = await requireAuth()
      requirePermission(user, 'branches.read')

      if (user.scopeType === 'global') {
        return await db.query.branches.findMany({
          with: {
            store: {
              columns: { name: true, storeNumber: true },
            },
          },
        })
      }

      if (user.scopeType === 'store') {
        return await db.query.branches.findMany({
          where: inArray(branches.storeNumber, user.scopes),
          with: {
            store: {
              columns: { name: true, storeNumber: true },
            },
          },
        })
      }

      return await db.query.branches.findMany({
        where: inArray(branches.branchNumber, user.scopes),
        with: {
          store: {
            columns: { name: true, storeNumber: true },
          },
        },
      })
    }),
    'Read branches failed:',
  ),
)

const updateBranch = createServerFn({ method: 'POST' })
  .inputValidator(
    branchFormSchema.extend({
      storeNumber: z.string(),
      branchId: z.string(),
    }),
  )
  .handler(
    withDbErrors(
      withSleepInDev(async ({ data }) => {
        const user = await requireAuth()
        requirePermission(user, 'branches.update')

        const foundBranch = await db.query.branches.findFirst({
          where: eq(branches.branchNumber, data.branchId),
        })

        if (!foundBranch) throw new NotFoundError('branch', data.branchId)

        requireAccessBranch(user, foundBranch)

        const { branchId, storeNumber, ...updatedData } = data

        const updatedBranches = await db
          .update(branches)
          .set(updatedData)
          .where(eq(branches.branchNumber, branchId))
          .returning()

        if (updatedBranches.length === 0) {
          throw new NotFoundError('branch', data.branchId)
        }

        return updatedBranches[0]
      }),
      'Update branch failed:',
    ),
  )

const deleteBranch = createServerFn({ method: 'POST' })
  .inputValidator((data: { branchId: string; storeId: string }) => data)
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'branches.delete')

      const store = await db.query.stores.findFirst({
        where: eq(stores.storeNumber, data.storeId),
      })
      if (!store) {
        throw new NotFoundError('store', data.storeId)
      }

      requireAccessStore(user, store)

      const deletedBranches = await db
        .delete(branches)
        .where(eq(branches.branchNumber, data.branchId))
        .returning()

      if (deletedBranches.length === 0) {
        throw new NotFoundError('branch', data.branchId)
      }

      return deletedBranches[0]
    }, 'Delete branch failed:'),
  )

const deleteBranches = createServerFn({ method: 'POST' })
  .inputValidator((data: { branchIds: Array<string>; storeId: string }) => data)
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'branches.delete')

      const store = await db.query.stores.findFirst({
        where: eq(stores.storeNumber, data.storeId),
      })
      if (!store) {
        throw new NotFoundError('store', data.storeId)
      }

      requireAccessStore(user, store)

      const deletedBranches = await db
        .delete(branches)
        .where(inArray(branches.branchNumber, data.branchIds))
        .returning()

      return deletedBranches
    }, 'Delete branches failed:'),
  )

export {
  createBranch,
  deleteBranch,
  deleteBranches,
  readBranch,
  readBranches,
  updateBranch,
}
