import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'

import { stores } from './resources/stores'
import { staff } from './staff'

// One-to-one relationship: each store has exactly one admin
// The storeId is the primary key, ensuring only one admin per store
export const storeAdmins = pgTable('store_admins', {
  storeId: uuid('store_id')
    .references(() => stores.id, { onDelete: 'cascade' })
    .primaryKey(),
  staffId: uuid('staff_id')
    .references(() => staff.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
