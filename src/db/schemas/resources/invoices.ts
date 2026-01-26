import {
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { invoiceStatusEnum } from '@/db/schemas/enums'

import { branches } from './branches'
import { stores } from './stores'
import { transactions } from './transactions'

export const invoices = pgTable('invoices', {
  id: uuid().defaultRandom().primaryKey(),

  // Denormalized references for query performance
  storeId: uuid('store_id')
    .references(() => stores.id, { onDelete: 'cascade' })
    .notNull(),
  branchId: uuid('branch_id')
    .references(() => branches.id, { onDelete: 'cascade' })
    .notNull(),
  transactionId: uuid('transaction_id')
    .references(() => transactions.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),

  // ====== ezPay Response Data ======
  invoiceNumber: varchar('invoice_number', { length: 20 }),
  randomNum: varchar('random_num', { length: 4 }),
  invoiceTransNo: varchar('invoice_trans_no', { length: 50 }),

  // ====== Invoice Details ======
  status: invoiceStatusEnum('status').default('pending').notNull(),

  // ====== Amounts (snapshot at invoice time) ======
  amt: decimal('amt', { precision: 10, scale: 2 }).notNull(),
  taxAmt: decimal('tax_amt', { precision: 10, scale: 2 }).notNull(),
  totalAmt: decimal('total_amt', { precision: 10, scale: 2 }).notNull(),

  // ====== Donation (捐贈) ======
  loveCode: varchar('love_code', { length: 7 }).notNull(),

  // ====== Error Tracking ======
  lastError: text('last_error'),
  retryCount: integer('retry_count').default(0).notNull(),

  // ====== Timestamps ======
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
