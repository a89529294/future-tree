import { relations } from 'drizzle-orm'
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type z from 'zod'

import { roomStatusEnum } from '../enums'
import { branches } from './branches'
import { stores } from './stores'

// 房間
export const rooms = pgTable('rooms', {
  id: uuid().defaultRandom().primaryKey(),
  branchId: uuid('branch_id')
    .references(() => branches.id, { onDelete: 'cascade' })
    .notNull(),
  storeId: uuid('store_id')
    .references(() => stores.id, { onDelete: 'cascade' })
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

export const roomsRelations = relations(rooms, ({ one }) => ({
  branch: one(branches, {
    fields: [rooms.branchId],
    references: [branches.id],
  }),
  store: one(stores, {
    fields: [rooms.storeId],
    references: [stores.id],
  }),
}))

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
