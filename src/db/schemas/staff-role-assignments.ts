import { pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

import { roles } from './roles'
import { staff } from './staff'

// Staff Role Assignments - One-to-one between staff and roleAssignments (each staff has exactly one role)
export const staffRoleAssignments = pgTable(
  'staff_role_assignments',
  {
    id: uuid().defaultRandom().primaryKey(),
    staffId: uuid('staff_id')
      .references(() => staff.id, { onDelete: 'cascade' })
      .notNull(),
    roleId: uuid('role_id')
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
    assignedAt: timestamp('assigned_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    assignedBy: uuid('assigned_by').references(() => staff.id),
  },
  (table) => [unique('staff_id_unique').on(table.staffId)],
)
