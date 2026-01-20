import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'

import { branches } from './resources/branches'
import { staff } from './staff'

// One-to-one relationship: each branch has exactly one admin
// The branchId is the primary key, ensuring only one admin per branch
// Note: Staff members can also have scope for the same branch, but only one can be the admin
export const branchAdmins = pgTable('branch_admins', {
  branchId: uuid('branch_id')
    .references(() => branches.id, { onDelete: 'cascade' })
    .primaryKey(),
  staffId: uuid('staff_id')
    .references(() => staff.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
