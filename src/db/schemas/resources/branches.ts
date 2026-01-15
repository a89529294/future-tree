import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
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

export const branchFormSchema = createInsertSchema(branches, {
  name: (schema) =>
    schema.trim().min(1, '名稱為必填欄位').max(255, '不能高過255字'),
  description: (schema) => schema.trim().max(1000, '不能超過1000字'),
}).pick({
  storeId: true,
  name: true,
  description: true,
})

export type BranchFormData = z.infer<typeof branchFormSchema>
