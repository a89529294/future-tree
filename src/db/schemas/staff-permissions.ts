import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { staff } from './staff'

// Staff Permissions - Individual permissions per staff member
export const staffPermissions = pgTable('staff_permissions', {
  id: uuid().defaultRandom().primaryKey(),
  staffId: uuid('staff_id')
    .references(() => staff.id, { onDelete: 'cascade' })
    .notNull(),
  permission: varchar('permission', { length: 50 }).notNull(), // e.g., 'machines.delete'
  grantedAt: timestamp('granted_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  grantedBy: uuid('granted_by').references(() => staff.id),
})
