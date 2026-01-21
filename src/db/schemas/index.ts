import { relations } from 'drizzle-orm'

import { branches } from '@/db/schemas/resources/branches'
import { inventory } from '@/db/schemas/resources/inventory'
import { machines } from '@/db/schemas/resources/machines'
import { stores } from '@/db/schemas/resources/stores'
import { transactionItems } from '@/db/schemas/resources/transaction-items'
import { transactions } from '@/db/schemas/resources/transactions'

import { branchAdmins } from './branch-admins'
import {
  machineStatusEnum,
  roleEnum,
  scopeTypeEnum,
  transactionStatusEnum,
} from './enums'
import { loggedInStaff } from './logged-in-staff'
import { roles } from './roles'
import { staff } from './staff'
import { staffPermissions } from './staff-permissions'
import { staffRoleAssignments } from './staff-role-assignments'
import { storeAdmins } from './store-admins'
import { userScopes } from './user-scopes'

// Relations
export const staffRelations = relations(staff, ({ many, one }) => ({
  roleAssignment: one(staffRoleAssignments, {
    fields: [staff.id],
    references: [staffRoleAssignments.staffId],
    relationName: 'roleAssignments',
  }),
  scopes: many(userScopes, {
    relationName: 'scopes',
  }),
  permissions: many(staffPermissions, {
    relationName: 'permissions',
  }),
  loggedIn: one(loggedInStaff),
  storeAdmin: one(storeAdmins, {
    fields: [staff.id],
    references: [storeAdmins.staffId],
  }),
  branchAdmin: one(branchAdmins, {
    fields: [staff.id],
    references: [branchAdmins.staffId],
  }),
}))

export const storesRelations = relations(stores, ({ many, one }) => ({
  branches: many(branches),
  userScopes: many(userScopes),
  machines: many(machines),
  inventory: many(inventory),
  transactions: many(transactions),
  admin: one(storeAdmins, {
    fields: [stores.id],
    references: [storeAdmins.storeId],
  }),
}))

export const branchesRelations = relations(branches, ({ one, many }) => ({
  store: one(stores, {
    fields: [branches.storeNumber],
    references: [stores.storeNumber],
  }),
  machines: many(machines),
  inventory: many(inventory),
  transactions: many(transactions),
  admin: one(branchAdmins, {
    fields: [branches.id],
    references: [branchAdmins.branchId],
  }),
}))

export const machinesRelations = relations(machines, ({ one, many }) => ({
  branch: one(branches, {
    fields: [machines.branchId],
    references: [branches.id],
  }),
  store: one(stores, {
    fields: [machines.storeId],
    references: [stores.id],
  }),
  inventory: many(inventory),
  transactions: many(transactions),
}))

export const inventoryRelations = relations(inventory, ({ one }) => ({
  machine: one(machines, {
    fields: [inventory.machineId],
    references: [machines.id],
  }),
  branch: one(branches, {
    fields: [inventory.branchId],
    references: [branches.id],
  }),
  store: one(stores, {
    fields: [inventory.storeId],
    references: [stores.id],
  }),
}))

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    machine: one(machines, {
      fields: [transactions.machineId],
      references: [machines.id],
    }),
    branch: one(branches, {
      fields: [transactions.branchId],
      references: [branches.id],
    }),
    store: one(stores, {
      fields: [transactions.storeId],
      references: [stores.id],
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

export const userScopesRelations = relations(userScopes, ({ one }) => ({
  staff: one(staff, {
    fields: [userScopes.staffId],
    references: [staff.id],
    relationName: 'scopes',
  }),
  store: one(stores, {
    fields: [userScopes.storeId],
    references: [stores.id],
  }),
  branch: one(branches, {
    fields: [userScopes.branchId],
    references: [branches.id],
  }),
}))

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

export const staffSessionsRelations = relations(loggedInStaff, ({ one }) => ({
  staff: one(staff, {
    fields: [loggedInStaff.staffId],
    references: [staff.id],
  }),
}))

export const storeAdminsRelations = relations(storeAdmins, ({ one }) => ({
  staff: one(staff, {
    fields: [storeAdmins.staffId],
    references: [staff.id],
  }),
  store: one(stores, {
    fields: [storeAdmins.storeId],
    references: [stores.id],
  }),
}))

export const branchAdminsRelations = relations(branchAdmins, ({ one }) => ({
  staff: one(staff, {
    fields: [branchAdmins.staffId],
    references: [staff.id],
  }),
  branch: one(branches, {
    fields: [branchAdmins.branchId],
    references: [branches.id],
  }),
}))

export {
  branchAdmins,
  branches,
  inventory,
  loggedInStaff,
  machines,
  machineStatusEnum,
  roleEnum,
  roles,
  scopeTypeEnum,
  staff,
  staffPermissions,
  staffRoleAssignments,
  storeAdmins,
  transactionItems,
  transactions,
  transactionStatusEnum,
  userScopes,
}

export * from '@/db/schemas/resources/branches'
export * from '@/db/schemas/resources/rooms'
export * from '@/db/schemas/resources/stores'
