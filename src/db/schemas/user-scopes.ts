import { pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core'

import { stores } from '@/db/schemas/resources/stores'

import { scopeTypeEnum } from './enums'
import { staff } from './staff'

// User Scopes - Unified access control table
// CONSTRAINTS (enforced at application level):
//   - A store can only have ONE store_admin
//   - A store_admin can own multiple stores
//   - A branch can only have ONE branch_admin
//   - A branch_admin's branches must all belong to the SAME store
//   - A staff member can only belong to ONE branch
export const userScopes = pgTable(
  'user_scopes',
  {
    id: uuid().defaultRandom().primaryKey(),
    staffId: uuid('staff_id')
      .references(() => staff.id, { onDelete: 'cascade' })
      .notNull(),
    scopeType: scopeTypeEnum('scope_type').notNull(), // 'store' | 'branch'
    scopeNumber: varchar('scope_number').notNull(), // The actual store/branch number
    storeNumber: varchar('store_number')
      .references(() => stores.id, { onDelete: 'cascade' })
      .notNull(), // Denormalized - always the store number
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique('user_scopes_staff_id_unique').on(table.staffId)],
)
