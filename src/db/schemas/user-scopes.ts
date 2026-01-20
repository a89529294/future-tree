import { pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

import { branches } from '@/db/schemas/resources/branches'
import { stores } from '@/db/schemas/resources/stores'

import { staff } from './staff'

// A staff can have multiple scopes (multiple stores or branches)
// - store_admin: Multiple rows with storeId, branchId is null
// - branch_admin/staff: Multiple rows with branchId, storeId is required
// - super_admin: No rows in this table
export const userScopes = pgTable(
  'user_scopes',
  {
    id: uuid().defaultRandom().primaryKey(),
    staffId: uuid('staff_id')
      .references(() => staff.id, { onDelete: 'cascade' })
      .notNull(),
    storeId: uuid('store_id')
      .references(() => stores.id, { onDelete: 'cascade' })
      .notNull(), // FK to stores.id (UUID)
    branchId: uuid('branch_id').references(() => branches.id, {
      onDelete: 'cascade',
    }), // Optional - only for branch-scoped
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Prevent duplicate scopes for the same staff
    unique('user_scopes_staff_id_store_id').on(table.staffId, table.storeId),
    unique('user_scopes_staff_id_branch_id').on(table.staffId, table.branchId),
  ],
)
