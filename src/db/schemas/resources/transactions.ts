import {
  decimal,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { transactionStatusEnum } from '@/db/schemas/enums'

import { branches } from './branches'
import { machines } from './machines'
import { stores } from './stores'

export const transactions = pgTable('transactions', {
  id: uuid().defaultRandom().primaryKey(),
  machineId: uuid('machine_id')
    .references(() => machines.id)
    .notNull(),
  branchId: uuid('branch_id')
    .references(() => branches.id, { onDelete: 'cascade' })
    .notNull(), // Denormalized from machine
  storeId: uuid('store_id')
    .references(() => stores.id, { onDelete: 'cascade' })
    .notNull(), // Denormalized from machine

  // Payment info (will be fake for V1)
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paymentStatus: transactionStatusEnum('payment_status')
    .default('pending')
    .notNull(),
  paymentReferenceId: varchar('payment_reference_id', { length: 255 }), // For future NewebPay integration

  // User info (minimal for guest checkout)
  userIpAddress: varchar('user_ip_address', { length: 45 }), // IPv6 support
  userAgent: text('user_agent'),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
