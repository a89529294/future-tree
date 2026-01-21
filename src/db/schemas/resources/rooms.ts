import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type z from 'zod'

import { roomStatusEnum } from '../enums'
import { branches } from './branches'

// 房間
export const rooms = pgTable('rooms', {
  id: uuid().defaultRandom().primaryKey(),
  storeNumber: varchar('store_number', { length: 10 })
    .references(() => branches.storeNumber, { onDelete: 'cascade' })
    .notNull(),
  branchNumber: varchar('branch_number', { length: 10 })
    .references(() => branches.branchNumber, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 20 }).notNull(),
  description: varchar('description', { length: 500 }),
  status: roomStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const roomSchema = createSelectSchema(rooms)
export type Room = z.infer<typeof roomSchema>

export const roomFormSchema = createInsertSchema(rooms, {
  name: (schema) =>
    schema.trim().min(1, '名稱為必填欄位').max(20, '不能超過20字'),
  description: (schema) => schema.trim().max(500, '描述不能超過500字'),
  status: (schema) => schema,
}).pick({
  name: true,
  description: true,
  status: true,
})

export type RoomFormData = z.infer<typeof roomFormSchema>
