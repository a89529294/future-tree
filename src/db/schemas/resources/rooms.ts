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

import { roomStatusEnum } from '../enums'
import { branches } from './branches'
import { stores } from './stores'

export const roomNumberSeq = pgSequence('room_number_seq', { startWith: 1 })

// 房間
export const rooms = pgTable('rooms', {
  id: uuid().defaultRandom().primaryKey(),
  storeId: uuid('store_id')
    .references(() => stores.id, { onDelete: 'cascade' })
    .notNull(),
  branchId: uuid('branch_id')
    .references(() => branches.id, { onDelete: 'cascade' })
    .notNull(),
  roomNumber: varchar('room_number', { length: 15 })
    .default(sql`'RM-' || lpad(nextval('room_number_seq')::text, 6, '0')`)
    .notNull()
    .unique(),
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
