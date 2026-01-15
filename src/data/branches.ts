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

const createBranch = createServerFn({ method: 'POST' })
  .inputValidator(branchFormSchema)
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'branches.create')

      const store = await db.query.stores.findFirst({
        where: eq(stores.id, data.storeId),
      })
      if (!store) {
        throw new NotFoundError('store', data.storeId)
      }

      requireAccessStore(user, store)

      const [newBranch] = await db.insert(branches).values(data).returning()

      return newBranch
    }, 'Create branch failed:'),
  )

const readBranch = createServerFn()
  .inputValidator((branchId: string) => branchId)
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'branches.read')

      const branch = await db.query.branches.findFirst({
        where: eq(branches.id, data),
      })
      if (!branch) {
        throw new NotFoundError('branch', data)
      }

      requireAccessBranch(user, branch)

      return branch
    }, 'Read branch failed:'),
  )

const readBranches = createServerFn().handler(
  withDbErrors(async () => {
    const user = await requireAuth()
    requirePermission(user, 'branches.read')

    if (user.scopeType === 'global') {
      return await db.query.branches.findMany({
        with: {
          store: {
            columns: { name: true },
          },
        },
      })
    }

    if (user.scopeType === 'store') {
      return await db.query.branches.findMany({
        where: inArray(branches.storeId, user.scopes),
        with: {
          store: {
            columns: { name: true },
          },
        },
      })
    }

    return await db.query.branches.findMany({
      where: inArray(branches.id, user.scopes),
      with: {
        store: {
          columns: { name: true },
        },
      },
    })
  }, 'Read branches failed:'),
)

const updateBranch = createServerFn({ method: 'POST' })
  .inputValidator(
    branchFormSchema.extend({
      storeId: z.string(),
      branchId: z.string(),
    }),
  )
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'branches.update')

      const foundBranch = await db.query.branches.findFirst({
        where: eq(branches.id, data.branchId),
      })

      if (!foundBranch) throw new NotFoundError('branch', data.branchId)

      requireAccessBranch(user, foundBranch)

      const { branchId, storeId, ...updatedData } = data

      const updatedBranches = await db
        .update(branches)
        .set(updatedData)
        .where(eq(branches.id, branchId))
        .returning()

      if (updatedBranches.length === 0) {
        throw new NotFoundError('branch', data.branchId)
      }

      return updatedBranches[0]
    }, 'Update branch failed:'),
  )

const deleteBranch = createServerFn({ method: 'POST' })
  .inputValidator((data: { branchId: string; storeId: string }) => data)
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'branches.delete')

      const store = await db.query.stores.findFirst({
        where: eq(stores.id, data.storeId),
      })
      if (!store) {
        throw new NotFoundError('store', data.storeId)
      }

      requireAccessStore(user, store)

      const deletedBranches = await db
        .delete(branches)
        .where(eq(branches.id, data.branchId))
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
        where: eq(stores.id, data.storeId),
      })
      if (!store) {
        throw new NotFoundError('store', data.storeId)
      }

      requireAccessStore(user, store)

      const deletedBranches = await db
        .delete(branches)
        .where(inArray(branches.id, data.branchIds))
        .returning()

      return deletedBranches
    }, 'Delete branches failed:'),
  )

export { deleteBranch, deleteBranches, readBranch, readBranches, updateBranch }
