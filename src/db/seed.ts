import 'dotenv/config'

import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'

import { createPool } from '@/db/config'
import * as schema from '@/db/schema'
import { hashPassword } from '@/utils/password'

export const db = drizzle(createPool())

async function seed() {
  console.log('Starting seed...')

  try {
    // 0. Clear existing data in reverse order (respecting foreign keys)
    console.log('Clearing existing data...')

    // Disable foreign key checks temporarily (PostgreSQL approach)
    await db.execute(sql`SET session_replication_role = 'replica';`)

    // Clear tables in correct order (child tables first)
    await db.delete(schema.staffLocationAccess)
    await db.delete(schema.staffStoreAccess)
    await db.delete(schema.staffRoleAssignments)
    await db.delete(schema.locations)
    await db.delete(schema.stores)
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

    const [locationAdminRole] = await db
      .insert(schema.roles)
      .values({
        name: 'location_admin',
        description: 'Location administrator with access to specific locations',
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

    const [locationAdmin] = await db
      .insert(schema.staff)
      .values({
        email: 'location@admin.com',
        passwordHash: defaultPassword,
        firstName: 'Location',
        lastName: 'Admin',
        phoneNumber: '+1234567893',
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
      staffId: locationAdmin.id,
      roleId: locationAdminRole.id,
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

    // 5. Create locations
    console.log('Creating locations...')
    const [store1Location1] = await db
      .insert(schema.locations)
      .values({
        storeId: store1.id,
        name: 'Main Floor',
        description: 'Main floor vending area',
      })
      .returning()

    const [store2Location1] = await db
      .insert(schema.locations)
      .values({
        storeId: store2.id,
        name: 'Ground Floor',
        description: 'Ground floor vending area',
      })
      .returning()

    const [store2Location2] = await db
      .insert(schema.locations)
      .values({
        storeId: store2.id,
        name: 'Second Floor',
        description: 'Second floor vending area',
      })
      .returning()

    console.log('Locations created successfully')

    // 6. Grant store access
    console.log('Granting store access...')
    await db.insert(schema.staffStoreAccess).values({
      staffId: storeAdmin1.id,
      storeId: store1.id,
      grantedBy: superAdmin.id,
    })

    await db.insert(schema.staffStoreAccess).values({
      staffId: storeAdmin2.id,
      storeId: store2.id,
      grantedBy: superAdmin.id,
    })

    console.log('Store access granted successfully')

    // 7. Grant location access (location admin only has access to one location from store 2)
    console.log('Granting location access...')
    await db.insert(schema.staffLocationAccess).values({
      staffId: locationAdmin.id,
      locationId: store2Location1.id,
      grantedBy: superAdmin.id,
    })

    console.log('Location access granted successfully')

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
      `- Location Admin: ${locationAdmin.email} (manages ${store2Location1.name} at ${store2.name})`,
    )
    console.log('\nStores:')
    console.log(`- ${store1.name}: 1 location (${store1Location1.name})`)
    console.log(
      `- ${store2.name}: 2 locations (${store2Location1.name}, ${store2Location2.name})`,
    )
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  } finally {
  }
}

seed()
