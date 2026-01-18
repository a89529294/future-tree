import { createServerFn } from '@tanstack/react-start'
import { eq, inArray } from 'drizzle-orm'
import z from 'zod'

import {
  NotFoundError,
  requireAccessGlobal,
  requireAccessStore,
  requireAuth,
  requirePermission,
} from '@/data/utils/authorize'
import { withDbErrors } from '@/data/utils/db-error'
import { db } from '@/db'
import { stores } from '@/db/schemas'
import { storeFormSchema } from '@/db/schemas/resources/stores'
import { withSleepInDev } from '@/utils'

const createStore = createServerFn({ method: 'POST' })
  .inputValidator(storeFormSchema)
  .handler(
    withDbErrors(
      withSleepInDev(async ({ data }) => {
        const user = await requireAuth()
        requirePermission(user, 'stores.create')

        requireAccessGlobal(user)

        const [newStore] = await db.insert(stores).values(data).returning()

        return newStore
      }),
    ),
  )

const readStore = createServerFn()
  .inputValidator((storeId: string) => storeId)
  .handler(
    withDbErrors(
      withSleepInDev(async ({ data }) => {
        const user = await requireAuth()
        requirePermission(user, 'stores.read')

        const store = await db.query.stores.findFirst({
          where: eq(stores.id, data),
        })
        if (!store) {
          throw new NotFoundError('store', data)
        }

        requireAccessStore(user, store)

        return store
      }),
      'Read store failed:',
    ),
  )

const readStores = createServerFn().handler(
  withDbErrors(
    withSleepInDev(async () => {
      const user = await requireAuth()
      requirePermission(user, 'stores.read')

      if (user.scopeType === 'global') {
        return await db.query.stores.findMany()
      }

      if (user.scopeType === 'store') {
        return await db.query.stores.findMany({
          where: inArray(stores.id, user.scopes),
        })
      }

      return []
    }),
    'Read stores failed:',
  ),
)

const updateStore = createServerFn()
  .inputValidator(storeFormSchema.extend({ id: z.string() }))
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'stores.update')

      const store = await db.query.stores.findFirst({
        where: eq(stores.id, data.id),
      })
      if (!store) {
        throw new Error('找不到此廠商')
      }

      requireAccessStore(user, store)

      const { id, ...updateData } = data

      const updatedStores = await db
        .update(stores)
        .set(updateData)
        .where(eq(stores.id, id))
        .returning()

      if (updatedStores.length === 0) {
        throw new Error('找不到此廠商')
      }

      return updatedStores[0]
    }, 'Update store failed:'),
  )

const deleteStore = createServerFn({ method: 'POST' })
  .inputValidator((storeId: string) => storeId)
  .handler(
    withDbErrors(
      withSleepInDev(async ({ data }) => {
        const user = await requireAuth()
        requirePermission(user, 'stores.delete')

        requireAccessGlobal(user)

        const deletedStores = await db
          .delete(stores)
          .where(eq(stores.id, data))
          .returning()

        if (deletedStores.length === 0) {
          throw new Error('找不到此廠商')
        }

        return deletedStores[0]
      }),
      'Delete store failed:',
    ),
  )

const deleteStores = createServerFn({ method: 'POST' })
  .inputValidator((data: { storeIds: Array<string> }) => data)
  .handler(
    withDbErrors(async ({ data }) => {
      const user = await requireAuth()
      requirePermission(user, 'stores.delete')

      requireAccessGlobal(user)

      const deletedStores = await db
        .delete(stores)
        .where(inArray(stores.id, data.storeIds))
        .returning()

      return deletedStores
    }, 'Delete stores failed:'),
  )

export {
  createStore,
  deleteStore,
  deleteStores,
  readStore,
  readStores,
  updateStore,
}
