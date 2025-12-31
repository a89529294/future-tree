import { relations } from 'drizzle-orm'
import {
  boolean,
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

// Relations
export const staffRelations = relations(staff, ({ many }) => ({
  roleAssignments: many(staffRoleAssignments),
  storeAccess: many(staffStoreAccess),
  locationAccess: many(staffLocationAccess),
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

export const rolesRelations = relations(roles, ({ many }) => ({
  staffAssignments: many(staffRoleAssignments),
}))

export const staffRoleAssignmentsRelations = relations(
  staffRoleAssignments,
  ({ one }) => ({
    staff: one(staff, {
      fields: [staffRoleAssignments.staffId],
      references: [staff.id],
    }),
    role: one(roles, {
      fields: [staffRoleAssignments.roleId],
      references: [roles.id],
    }),
    assignedByStaff: one(staff, {
      fields: [staffRoleAssignments.assignedBy],
      references: [staff.id],
    }),
  }),
)

export const staffStoreAccessRelations = relations(
  staffStoreAccess,
  ({ one }) => ({
    staff: one(staff, {
      fields: [staffStoreAccess.staffId],
      references: [staff.id],
    }),
    store: one(stores, {
      fields: [staffStoreAccess.storeId],
      references: [stores.id],
    }),
    grantedByStaff: one(staff, {
      fields: [staffStoreAccess.grantedBy],
      references: [staff.id],
    }),
  }),
)

export const staffLocationAccessRelations = relations(
  staffLocationAccess,
  ({ one }) => ({
    staff: one(staff, {
      fields: [staffLocationAccess.staffId],
      references: [staff.id],
    }),
    location: one(locations, {
      fields: [staffLocationAccess.locationId],
      references: [locations.id],
    }),
    grantedByStaff: one(staff, {
      fields: [staffLocationAccess.grantedBy],
      references: [staff.id],
    }),
  }),
)
