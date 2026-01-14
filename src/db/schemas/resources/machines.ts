import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type z from 'zod'

import { machineStatusEnum } from '@/db/schemas/enums'

import { branches } from './branches'
import { stores } from './stores'

export const machines = pgTable('machines', {
  id: uuid().defaultRandom().primaryKey(),
  branchId: uuid('branch_id')
    .references(() => branches.id, { onDelete: 'cascade' })
    .notNull(),
  storeId: uuid('store_id')
    .references(() => stores.id, { onDelete: 'cascade' })
    .notNull(), // Denormalized from branch
  thingId: varchar('thing_id', { length: 255 }).unique().notNull(), // e.g., "machine_01"
  displayName: varchar('display_name', { length: 255 }), // e.g., "Lobby Machine"
  status: machineStatusEnum('status').default('offline').notNull(),
  lastHeartbeat: timestamp('last_heartbeat', { withTimezone: true }),
  notes: text('notes'), // Admin notes about this machine
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const machineSchema = createSelectSchema(machines)
export type Store = z.infer<typeof machineSchema>

export const machineFormSchema = createInsertSchema(machines, {
  thingId: (schema) =>
    schema.trim().min(1, 'thingID為必填欄位').max(50, '不能高過50字'),
}).pick({
  branchId: true,
  storeId: true,
  thingId: true,
  displayName: true,
  status: true,
  notes: true,
})

export type MachineFormData = z.infer<typeof machineFormSchema>
