import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { roleEnum } from './enums'

// Roles table - Role definitions
export const roles = pgTable('roles', {
  id: uuid().defaultRandom().primaryKey(),
  name: roleEnum('name').unique().notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
