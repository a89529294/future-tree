import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'

import { staff } from './staff'

export const loggedInStaff = pgTable('logged_in_staff', {
  id: uuid().defaultRandom().primaryKey(),
  staffId: uuid('staff_id')
    .references(() => staff.id)
    .notNull()
    .unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
