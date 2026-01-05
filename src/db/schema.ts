import { relations } from 'drizzle-orm'
import {
  boolean,
  decimal,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

// Enums
export const roleEnum = pgEnum('role', [
  'super_admin',
  'store_admin',
  'location_admin',
  'staff',
])

export const machineStatusEnum = pgEnum('machine_status', [
  'online',
  'offline',
  'maintenance',
])

export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'paid',
  'failed',
])

// Staff table - Core staff authentication and profile
export const staff = pgTable('staff', {
  id: uuid().defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

// Roles table - Role definitions
export const roles = pgTable('roles', {
  id: uuid().defaultRandom().primaryKey(),
  name: roleEnum('name').unique().notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

// Staff Role Assignments - Many-to-many between staff and roles
export const staffRoleAssignments = pgTable('staff_role_assignments', {
  id: uuid().defaultRandom().primaryKey(),
  staffId: uuid('staff_id')
    .references(() => staff.id, { onDelete: 'cascade' })
    .notNull(),
  roleId: uuid('role_id')
    .references(() => roles.id, { onDelete: 'cascade' })
    .notNull(),
  assignedAt: timestamp('assigned_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  assignedBy: uuid('assigned_by').references(() => staff.id),
})

// Staff Store Access - Controls which stores a staff member can access
export const staffStoreAccess = pgTable('staff_store_access', {
  id: uuid().defaultRandom().primaryKey(),
  staffId: uuid('staff_id')
    .references(() => staff.id, { onDelete: 'cascade' })
    .notNull(),
  storeId: uuid('store_id').notNull(), // Will reference stores table below
  grantedAt: timestamp('granted_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  grantedBy: uuid('granted_by').references(() => staff.id),
})

// Staff Location Access - Controls which locations a staff member can access
export const staffLocationAccess = pgTable('staff_location_access', {
  id: uuid().defaultRandom().primaryKey(),
  staffId: uuid('staff_id')
    .references(() => staff.id, { onDelete: 'cascade' })
    .notNull(),
  locationId: uuid('location_id').notNull(), // Will reference locations table below
  grantedAt: timestamp('granted_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  grantedBy: uuid('granted_by').references(() => staff.id),
})

// Staff Permissions - Individual permissions per staff member
// Add row = grant permission, Delete row = revoke permission
export const staffPermissions = pgTable('staff_permissions', {
  id: uuid().defaultRandom().primaryKey(),
  staffId: uuid('staff_id')
    .references(() => staff.id, { onDelete: 'cascade' })
    .notNull(),
  permission: varchar('permission', { length: 50 }).notNull(), // e.g., 'machines.delete'
  grantedAt: timestamp('granted_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  grantedBy: uuid('granted_by').references(() => staff.id),
})

// Stores table
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

// Locations table
export const locations = pgTable('locations', {
  id: uuid().defaultRandom().primaryKey(),
  storeId: uuid('store_id')
    .references(() => stores.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const machines = pgTable('machines', {
  id: uuid().defaultRandom().primaryKey(),
  locationId: uuid('location_id')
    .references(() => locations.id, { onDelete: 'cascade' })
    .notNull(),
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

export const inventory = pgTable('inventory', {
  id: uuid().defaultRandom().primaryKey(),
  machineId: uuid('machine_id')
    .references(() => machines.id, { onDelete: 'cascade' })
    .notNull(),
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

export const transactions = pgTable('transactions', {
  id: uuid().defaultRandom().primaryKey(),
  machineId: uuid('machine_id')
    .references(() => machines.id)
    .notNull(),

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

export const transactionItems = pgTable('transaction_items', {
  id: uuid().defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id')
    .references(() => transactions.id, { onDelete: 'cascade' })
    .notNull(),
  cellNumber: integer('cell_number').notNull(),

  // Snapshot of product at time of purchase
  productName: varchar('product_name', { length: 255 }).notNull(),
  productDescription: text('product_description'),
  priceAtPurchase: decimal('price_at_purchase', {
    precision: 10,
    scale: 2,
  }).notNull(),
})

// Relations
export const staffRelations = relations(staff, ({ many }) => ({
  roleAssignments: many(staffRoleAssignments, {
    relationName: 'roleAssignments',
  }),
  storeAccess: many(staffStoreAccess, {
    relationName: 'storeAccess',
  }),
  locationAccess: many(staffLocationAccess, {
    relationName: 'locationAccess',
  }),
  permissions: many(staffPermissions, {
    relationName: 'permissions',
  }),
}))

export const storesRelations = relations(stores, ({ many }) => ({
  locations: many(locations),
  staffAccess: many(staffStoreAccess),
}))

export const locationsRelations = relations(locations, ({ one, many }) => ({
  store: one(stores, {
    fields: [locations.storeId],
    references: [stores.id],
  }),
  staffAccess: many(staffLocationAccess),
}))

export const machinesRelations = relations(machines, ({ one, many }) => ({
  location: one(locations, {
    fields: [machines.locationId],
    references: [locations.id],
  }),
  inventory: many(inventory),
  transactions: many(transactions),
}))

export const inventoryRelations = relations(inventory, ({ one }) => ({
  machine: one(machines, {
    fields: [inventory.machineId],
    references: [machines.id],
  }),
}))

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    machine: one(machines, {
      fields: [transactions.machineId],
      references: [machines.id],
    }),
    items: many(transactionItems),
  }),
)

export const transactionItemsRelations = relations(
  transactionItems,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [transactionItems.transactionId],
      references: [transactions.id],
    }),
  }),
)

export const rolesRelations = relations(roles, ({ many }) => ({
  staffAssignments: many(staffRoleAssignments),
}))

export const staffRoleAssignmentsRelations = relations(
  staffRoleAssignments,
  ({ one }) => ({
    staff: one(staff, {
      fields: [staffRoleAssignments.staffId],
      references: [staff.id],
      relationName: 'roleAssignments',
    }),
    role: one(roles, {
      fields: [staffRoleAssignments.roleId],
      references: [roles.id],
    }),
    assignedByStaff: one(staff, {
      fields: [staffRoleAssignments.assignedBy],
      references: [staff.id],
      relationName: 'assignedRoles',
    }),
  }),
)

export const staffStoreAccessRelations = relations(
  staffStoreAccess,
  ({ one }) => ({
    staff: one(staff, {
      fields: [staffStoreAccess.staffId],
      references: [staff.id],
      relationName: 'storeAccess',
    }),
    store: one(stores, {
      fields: [staffStoreAccess.storeId],
      references: [stores.id],
    }),
    grantedByStaff: one(staff, {
      fields: [staffStoreAccess.grantedBy],
      references: [staff.id],
      relationName: 'grantedStoreAccess',
    }),
  }),
)

export const staffLocationAccessRelations = relations(
  staffLocationAccess,
  ({ one }) => ({
    staff: one(staff, {
      fields: [staffLocationAccess.staffId],
      references: [staff.id],
      relationName: 'locationAccess',
    }),
    location: one(locations, {
      fields: [staffLocationAccess.locationId],
      references: [locations.id],
    }),
    grantedByStaff: one(staff, {
      fields: [staffLocationAccess.grantedBy],
      references: [staff.id],
      relationName: 'grantedLocationAccess',
    }),
  }),
)

export const staffPermissionsRelations = relations(
  staffPermissions,
  ({ one }) => ({
    staff: one(staff, {
      fields: [staffPermissions.staffId],
      references: [staff.id],
      relationName: 'permissions',
    }),
    grantedByStaff: one(staff, {
      fields: [staffPermissions.grantedBy],
      references: [staff.id],
      relationName: 'grantedPermissions',
    }),
  }),
)
