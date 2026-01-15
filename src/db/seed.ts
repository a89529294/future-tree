import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'

import { createPool } from '@/db/config'
import * as schema from '@/db/schemas'
import { hashPassword } from '@/utils/auth/password'
import { ROLE_DEFAULT_PERMISSIONS } from '@/utils/auth/types-and-constants'

export const db = drizzle(createPool())

async function seed() {
  console.log('Starting seed...')

  try {
    // 0. Clear existing data in reverse order (respecting foreign keys)
    console.log('Clearing existing data...')

    // Disable foreign key checks temporarily (PostgreSQL approach)
    await db.execute(sql`SET session_replication_role = 'replica';`)

    // Clear tables in correct order (child tables first)
    await db.delete(schema.transactionItems)
    await db.delete(schema.transactions)
    await db.delete(schema.inventory)
    await db.delete(schema.machines)
    await db.delete(schema.branches)
    await db.delete(schema.stores)
    await db.delete(schema.userScopes)
    await db.delete(schema.staffPermissions)
    await db.delete(schema.staffRoleAssignments)
    await db.delete(schema.staff)
    await db.delete(schema.roles)

    // Re-enable foreign key checks
    await db.execute(sql`SET session_replication_role = 'origin';`)

    console.log('Existing data cleared successfully')

    // 1. Create roles
    console.log('Creating roles...')
    const [superAdminRole] = await db
      .insert(schema.roles)
      .values({
        name: 'super_admin',
        description: 'Super administrator with full system access',
      })
      .returning()

    const [storeAdminRole] = await db
      .insert(schema.roles)
      .values({
        name: 'store_admin',
        description: 'Store administrator with access to specific stores',
      })
      .returning()

    const [branchAdminRole] = await db
      .insert(schema.roles)
      .values({
        name: 'branch_admin',
        description: 'Branch administrator with access to specific branches',
      })
      .returning()

    const [staffRole] = await db
      .insert(schema.roles)
      .values({
        name: 'staff',
        description: 'Regular staff',
      })
      .returning()

    console.log('Roles created successfully')

    // 2. Create staff members
    console.log('Creating staff members...')
    const defaultPassword = await hashPassword(process.env.TEMP_PASSWORD!)

    const [superAdmin] = await db
      .insert(schema.staff)
      .values({
        email: 'super@admin.com',
        passwordHash: defaultPassword,
        firstName: 'Super',
        lastName: 'Admin',
        phoneNumber: '+1234567890',
        isActive: true,
      })
      .returning()

    const [storeAdmin1] = await db
      .insert(schema.staff)
      .values({
        email: 'store1@admin.com',
        passwordHash: defaultPassword,
        firstName: 'Store',
        lastName: 'Admin One',
        phoneNumber: '+1234567891',
        isActive: true,
      })
      .returning()

    const [storeAdmin2] = await db
      .insert(schema.staff)
      .values({
        email: 'store2@admin.com',
        passwordHash: defaultPassword,
        firstName: 'Store',
        lastName: 'Admin Two',
        phoneNumber: '+1234567892',
        isActive: true,
      })
      .returning()

    const [branchAdmin] = await db
      .insert(schema.staff)
      .values({
        email: 'branch@admin.com',
        passwordHash: defaultPassword,
        firstName: 'Branch',
        lastName: 'Admin',
        phoneNumber: '+1234567893',
        isActive: true,
      })
      .returning()

    const [staffMember] = await db
      .insert(schema.staff)
      .values({
        email: 'staff@example.com',
        passwordHash: defaultPassword,
        firstName: 'Regular',
        lastName: 'Staff',
        phoneNumber: '+1234567894',
        isActive: true,
      })
      .returning()

    console.log('Staff members created successfully')

    // 3. Assign roles to staff
    console.log('Assigning roles...')
    await db.insert(schema.staffRoleAssignments).values({
      staffId: superAdmin.id,
      roleId: superAdminRole.id,
      assignedBy: superAdmin.id,
    })

    await db.insert(schema.staffRoleAssignments).values({
      staffId: storeAdmin1.id,
      roleId: storeAdminRole.id,
      assignedBy: superAdmin.id,
    })

    await db.insert(schema.staffRoleAssignments).values({
      staffId: storeAdmin2.id,
      roleId: storeAdminRole.id,
      assignedBy: superAdmin.id,
    })

    await db.insert(schema.staffRoleAssignments).values({
      staffId: branchAdmin.id,
      roleId: branchAdminRole.id,
      assignedBy: superAdmin.id,
    })

    await db.insert(schema.staffRoleAssignments).values({
      staffId: staffMember.id,
      roleId: staffRole.id,
      assignedBy: superAdmin.id,
    })

    console.log('Roles assigned successfully')

    // 4. Create stores
    console.log('Creating stores...')
    const [store1] = await db
      .insert(schema.stores)
      .values({
        name: 'Downtown Store',
        address: '123 Main Street, Downtown',
        phoneNumber: '+1555000001',
      })
      .returning()

    const [store2] = await db
      .insert(schema.stores)
      .values({
        name: 'Uptown Store',
        address: '456 Oak Avenue, Uptown',
        phoneNumber: '+1555000002',
      })
      .returning()

    console.log('Stores created successfully')

    // 5. Create branches
    console.log('Creating branches...')
    const [store1Branch1] = await db
      .insert(schema.branches)
      .values({
        storeId: store1.id,
        name: 'Main Floor',
        description: 'Main floor vending area',
      })
      .returning()

    const [store2Branch1] = await db
      .insert(schema.branches)
      .values({
        storeId: store2.id,
        name: 'Main Branch',
        description: 'Main branch vending area',
      })
      .returning()

    const [store2Branch2] = await db
      .insert(schema.branches)
      .values({
        storeId: store2.id,
        name: 'Second Floor',
        description: 'Second floor vending area',
      })
      .returning()

    console.log('Branches created successfully')

    // 6. Grant scopes using unified userScopes table
    console.log('Granting user scopes...')

    // Store admin 1 gets store-level scope for store 1
    await db.insert(schema.userScopes).values({
      staffId: storeAdmin1.id,
      scopeType: 'store',
      scopeId: store1.id,
      storeId: store1.id, // For store scopes, scopeId === storeId
    })

    // Store admin 2 gets store-level scope for store 2
    await db.insert(schema.userScopes).values({
      staffId: storeAdmin2.id,
      scopeType: 'store',
      scopeId: store2.id,
      storeId: store2.id,
    })

    // Branch admin gets branch-level scope for store2Branch1
    await db.insert(schema.userScopes).values({
      staffId: branchAdmin.id,
      scopeType: 'branch',
      scopeId: store2Branch1.id,
      storeId: store2.id,
    })

    // Staff member gets branch-level scope for store1Branch1
    await db.insert(schema.userScopes).values({
      staffId: staffMember.id,
      scopeType: 'branch',
      scopeId: store1Branch1.id,
      storeId: store1.id,
    })

    console.log('User scopes granted successfully')

    // 8. Grant permissions based on roles
    console.log('Granting permissions...')

    // Super admin gets all permissions
    const superAdminPermissions = ROLE_DEFAULT_PERMISSIONS.super_admin

    for (const permission of superAdminPermissions) {
      await db.insert(schema.staffPermissions).values({
        staffId: superAdmin.id,
        permission,
        grantedBy: superAdmin.id,
      })
    }

    // Store admins get store admin permissions
    const storeAdminPermissions = ROLE_DEFAULT_PERMISSIONS.store_admin

    for (const permission of storeAdminPermissions) {
      await db.insert(schema.staffPermissions).values({
        staffId: storeAdmin1.id,
        permission,
        grantedBy: superAdmin.id,
      })
      await db.insert(schema.staffPermissions).values({
        staffId: storeAdmin2.id,
        permission,
        grantedBy: superAdmin.id,
      })
    }

    // Branch admin gets branch admin permissions
    const branchAdminPermissions = ROLE_DEFAULT_PERMISSIONS.branch_admin

    for (const permission of branchAdminPermissions) {
      await db.insert(schema.staffPermissions).values({
        staffId: branchAdmin.id,
        permission,
        grantedBy: superAdmin.id,
      })
    }

    // Regular staff gets specific permissions
    const staffPermissions = ROLE_DEFAULT_PERMISSIONS.staff

    for (const permission of staffPermissions) {
      await db.insert(schema.staffPermissions).values({
        staffId: staffMember.id,
        permission,
        grantedBy: superAdmin.id,
      })
    }

    console.log('Permissions granted successfully')

    console.log('Creating machines...')

    const machines = []

    // 3 machines in lobby
    for (let i = 1; i <= 3; i++) {
      const [machine] = await db
        .insert(schema.machines)
        .values({
          branchId: store1Branch1.id,
          storeId: store1.id, // Denormalized from branch
          thingId: `machine_${i.toString().padStart(2, '0')}`,
          displayName: `Lobby Unit ${i}`,
          status: 'offline',
          notes: 'V1 test machine',
        })
        .returning()
      machines.push(machine)
    }

    // 2 machines on 2nd floor
    for (let i = 4; i <= 5; i++) {
      const [machine] = await db
        .insert(schema.machines)
        .values({
          branchId: store1Branch1.id,
          storeId: store1.id, // Denormalized from branch
          thingId: `machine_${i.toString().padStart(2, '0')}`,
          displayName: `2F Unit ${i - 3}`,
          status: 'offline',
          notes: 'V1 test machine',
        })
        .returning()
      machines.push(machine)
    }

    // 2 machines in store2Branch1 (Main Branch)
    for (let i = 6; i <= 7; i++) {
      const [machine] = await db
        .insert(schema.machines)
        .values({
          branchId: store2Branch1.id,
          storeId: store2.id,
          thingId: `machine_${i.toString().padStart(2, '0')}`,
          displayName: `Main Branch Unit ${i - 5}`,
          status: 'offline',
          notes: 'V1 test machine',
        })
        .returning()
      machines.push(machine)
    }

    // 2 machines in store2Branch2 (Second Floor)
    for (let i = 8; i <= 9; i++) {
      const [machine] = await db
        .insert(schema.machines)
        .values({
          branchId: store2Branch2.id,
          storeId: store2.id,
          thingId: `machine_${i.toString().padStart(2, '0')}`,
          displayName: `2F Unit ${i - 7}`,
          status: 'offline',
          notes: 'V1 test machine',
        })
        .returning()
      machines.push(machine)
    }

    console.log('Creating inventory...')

    const products = [
      {
        name: 'Snack Box A',
        description: '2 bags of chips, 1 chocolate bar, 1 cookie pack',
        price: '50.00',
        imageUrl: 'https://picsum.photos/seed/snackA/400/400',
      },
      {
        name: 'Drink Bundle',
        description: '2 cans of Coke, 1 bottle of tea',
        price: '30.00',
        imageUrl: 'https://picsum.photos/seed/drink/400/400',
      },
      {
        name: 'Healthy Mix',
        description: '1 granola bar, 1 fruit cup, 1 nuts pack',
        price: '45.00',
        imageUrl: 'https://picsum.photos/seed/healthy/400/400',
      },
      {
        name: 'Premium Box',
        description: 'Imported snacks: 1 Japanese KitKat, 1 Pocky, 1 Hi-Chew',
        price: '120.00',
        imageUrl: 'https://picsum.photos/seed/premium/400/400',
      },
      {
        name: 'Energy Bundle',
        description: '2 energy drinks, 1 protein bar',
        price: '80.00',
        imageUrl: 'https://picsum.photos/seed/energy/400/400',
      },
    ]

    for (const machine of machines) {
      for (let cellNumber = 1; cellNumber <= 5; cellNumber++) {
        const product = products[cellNumber - 1]

        await db.insert(schema.inventory).values({
          machineId: machine.id,
          branchId: machine.branchId, // Denormalized from machine
          storeId: machine.storeId, // Denormalized from machine
          cellNumber,
          productName: product.name,
          productDescription: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          stockAvailable: true, // All stocked initially
        })
      }
    }

    console.log('\n=== Seed completed successfully! ===')
    console.log('\nCreated users (all with password: password123):')
    console.log(`- Super Admin: ${superAdmin.email}`)
    console.log(
      `- Store Admin 1: ${storeAdmin1.email} (manages ${store1.name})`,
    )
    console.log(
      `- Store Admin 2: ${storeAdmin2.email} (manages ${store2.name})`,
    )
    console.log(
      `- Branch Admin: ${branchAdmin.email} (manages ${store2Branch1.name} at ${store2.name})`,
    )
    console.log(
      `- Staff: ${staffMember.email} (works at ${store1Branch1.name} in ${store1.name})`,
    )
    console.log('\nStores:')
    console.log(`- ${store1.name}: 1 branch (${store1Branch1.name})`)
    console.log(
      `- ${store2.name}: 2 branches (${store2Branch1.name}, ${store2Branch2.name})`,
    )
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  } finally {
  }
}

seed()
