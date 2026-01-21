import { pgEnum } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', [
  'super_admin',
  'store_admin',
  'branch_admin',
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

export const scopeTypeEnum = pgEnum('scope_type', ['store', 'branch'])

export const roomStatusEnum = pgEnum('room_status', ['active', 'inactive'])
