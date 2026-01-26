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

  // ====== Payment Amounts ======
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  amt: decimal('amt', { precision: 10, scale: 2 }),
  taxAmt: decimal('tax_amt', { precision: 10, scale: 2 }),

  // ====== Payment Status ======
  paymentStatus: transactionStatusEnum('payment_status')
    .default('pending')
    .notNull(),

  // ====== NewebPay Response Fields ======
  newebpayTradeNo: varchar('newebpay_trade_no', { length: 50 }),
  newebpayPaymentType: varchar('newebpay_payment_type', { length: 20 }),
  newebpayPayTime: timestamp('newebpay_pay_time', { withTimezone: true }),
  newebpayIp: varchar('newebpay_ip', { length: 45 }),

  // ====== Invoice Linkage ======
  invoiceId: uuid('invoice_id'),

  // ====== User Info (minimal for guest checkout) ======
  userIpAddress: varchar('user_ip_address', { length: 45 }),
  userAgent: text('user_agent'),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
