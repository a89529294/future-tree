import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import type z from 'zod'

import { stores } from './stores'

// Branches table
export const branches = pgTable('branches', {
  id: uuid().defaultRandom().primaryKey(),
  storeId: uuid('store_id')
    .references(() => stores.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const branchSchema = createSelectSchema(branches)
export type Branch = z.infer<typeof branchSchema>
