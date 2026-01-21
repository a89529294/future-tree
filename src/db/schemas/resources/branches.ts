import { relations, sql } from 'drizzle-orm'
import {
  pgSequence,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type z from 'zod'

import { rooms } from './rooms'
import { stores } from './stores'

export const branchNumberSeq = pgSequence('branch_number_seq', { startWith: 1 })

// 店家
export const branches = pgTable('branches', {
  id: uuid().defaultRandom().primaryKey(),
  storeId: uuid('store_id')
    .references(() => stores.id, { onDelete: 'cascade' })
    .notNull(),
  branchNumber: varchar('branch_number', { length: 10 }) // 店家編號
    .default(sql`'ST-' || lpad(nextval('branch_number_seq')::text, 5, '0')`)
    .notNull()
    .unique(),
  name: varchar('name', { length: 20 }).notNull(),
  city: varchar('city', { length: 10 }).notNull(),
  district: varchar('district', { length: 10 }).notNull(),
  address: varchar('address', { length: 100 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const branchesRelations = relations(branches, ({ many }) => ({
  rooms: many(rooms),
}))

export const branchSchema = createSelectSchema(branches)
export type Branch = z.infer<typeof branchSchema>

export const branchFormSchema = createInsertSchema(branches, {
  name: (schema) =>
    schema.trim().min(1, '名稱為必填欄位').max(20, '不能超過20字'),
  city: (schema) =>
    schema.trim().min(1, '城市為必填欄位').max(10, '城市不能超過10字'),
  district: (schema) =>
    schema.trim().min(1, '地區為必填欄位').max(10, '地區不能超過10字'),
  address: (schema) =>
    schema.trim().min(1, '地址為必填欄位').max(100, '地址不能超過100字'),
  phoneNumber: (schema) => schema.trim().max(20, '電話號碼不能超過20字'),
}).pick({
  name: true,
  city: true,
  district: true,
  address: true,
  phoneNumber: true,
})

export type BranchFormData = z.infer<typeof branchFormSchema>
