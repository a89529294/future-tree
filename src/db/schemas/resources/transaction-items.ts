import {
  decimal,
  integer,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { branches } from '@/db/schemas/resources/branches'
import { stores } from '@/db/schemas/resources/stores'

import { transactions } from './transactions'

export const transactionItems = pgTable('transaction_items', {
  id: uuid().defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id')
    .references(() => transactions.id, { onDelete: 'cascade' })
    .notNull(),
  branchId: uuid('branch_id')
    .references(() => branches.id, { onDelete: 'cascade' })
    .notNull(), // Denormalized from machine
  storeId: uuid('store_id')
    .references(() => stores.id, { onDelete: 'cascade' })
    .notNull(), // Denormalized from machine
  cellNumber: integer('cell_number').notNull(),

  // Snapshot of product at time of purchase
  productName: varchar('product_name', { length: 255 }).notNull(),
  productDescription: text('product_description'),
  priceAtPurchase: decimal('price_at_purchase', {
    precision: 10,
    scale: 2,
  }).notNull(),
})
