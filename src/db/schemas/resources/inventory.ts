import {
  boolean,
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { branches } from './branches'
import { machines } from './machines'
import { stores } from './stores'

export const inventory = pgTable('inventory', {
  id: uuid().defaultRandom().primaryKey(),
  machineId: uuid('machine_id')
    .references(() => machines.id, { onDelete: 'cascade' })
    .notNull(),
  branchId: uuid('branch_id')
    .references(() => branches.id, { onDelete: 'cascade' })
    .notNull(), // Denormalized from machine
  storeId: uuid('store_id')
    .references(() => stores.id, { onDelete: 'cascade' })
    .notNull(), // Denormalized from machine
  cellNumber: integer('cell_number').notNull(), // 1 to 5

  // Product details (configured by admin)
  productName: varchar('product_name', { length: 255 }),
  productDescription: text('product_description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),

  // Stock status
  stockAvailable: boolean('stock_available').default(false).notNull(),
  lastRestocked: timestamp('last_restocked', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
