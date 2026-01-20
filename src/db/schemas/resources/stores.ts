import { sql } from 'drizzle-orm'
import {
  pgSequence,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type z from 'zod'

// Sequence for store_id auto-generation
export const storeNumberSeq = pgSequence('store_number_seq', { startWith: 1 })

// 集團
export const stores = pgTable('stores', {
  id: uuid().defaultRandom().primaryKey(),
  storeNumber: varchar('store_number', { length: 10 })
    .default(sql`'GP-' || lpad(nextval('store_number_seq')::text, 5, '0')`)
    .notNull()
    .unique(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  city: varchar('city', { length: 10 }),
  district: varchar('district', { length: 10 }),
  address: varchar('address', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

// Full store schema
export const storeSchema = createSelectSchema(stores)
export type Store = z.infer<typeof storeSchema>

export const storeFormSchema = createInsertSchema(stores, {
  name: (schema) =>
    schema.trim().min(1, '名稱為必填欄位').max(50, '不能高過50字'),
  city: (schema) => schema.trim().max(10, '不能超過10字'),
  district: (schema) => schema.trim().max(10, '不能超過10字'),
  address: (schema) => schema.trim().max(100, '不能超過100字'),
}).pick({
  name: true,
  city: true,
  district: true,
  address: true,
})

export type StoreFormData = z.infer<typeof storeFormSchema>
