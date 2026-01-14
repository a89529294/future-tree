import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type z from 'zod'

export const stores = pgTable('stores', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  phoneNumber: varchar('phone_number', { length: 20 }),
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
  phoneNumber: (schema) =>
    schema
      .trim()
      .regex(/^[0-9-+() ]*$/, '請輸入有效的電話號碼')
      .max(20, '不能超過20位數'),
  address: (schema) =>
    schema.trim().min(1, '地址有填入不能為空').max(100, '不能超過100字'),
}).pick({
  name: true,
  address: true,
  phoneNumber: true,
})

export type StoreFormData = z.infer<typeof storeFormSchema>
