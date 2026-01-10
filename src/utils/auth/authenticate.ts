import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { staff } from '@/db/schemas'
import { hashPassword } from '@/utils/auth/password'
import { useAppSession } from '@/utils/auth/session'

import type { LoginUser, SessionUser } from './types-and-constants'

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((d: LoginUser) => d)
  .handler(async ({ data }) => {
    // Find the user by email
    const user = await db.query.staff.findFirst({
      where: eq(staff.email, data.email),
    })

    // Check if the user exists
    if (!user) {
      throw new Error('使用者不存在')
    }

    // Check if the user is active
    if (!user.isActive) {
      throw new Error('無效使用者')
    }

    // Check if the password is correct
    const hashedPassword = await hashPassword(data.password)

    if (user.passwordHash !== hashedPassword) {
      throw new Error('密碼不正確')
    }

    // Fetch user with relations
    const result = await db.query.staff.findFirst({
      where: eq(staff.id, user.id),
      with: {
        roleAssignments: {
          with: {
            role: true,
          },
        },
        storeAccess: true,
        locationAccess: true,
        permissions: true,
      },
    })

    if (!result) {
      throw new Error('Impossible condition')
    }

    // Determine the highest role (priority: super_admin > store_admin > location_admin > staff)
    const rolePriority: Record<SessionUser['role'], number> = {
      super_admin: 4,
      store_admin: 3,
      location_admin: 2,
      staff: 1,
    }

    const highestRole = result.roleAssignments.reduce(
      (
        highest: SessionUser['role'],
        assignment: { role: { name: SessionUser['role'] } },
      ) => {
        const currentRole = assignment.role.name
        return rolePriority[currentRole] > rolePriority[highest]
          ? currentRole
          : highest
      },
      'staff' as SessionUser['role'],
    )

    // Create a session
    const session = await useAppSession()

    session.update({
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        role: highestRole,
        permissions: result.permissions.map(
          (p: { permission: string }) => p.permission,
        ),
        storeAccess: result.storeAccess.map(
          (access: { storeId: string }) => access.storeId,
        ),
        locationAccess: result.locationAccess.map(
          (access: { locationId: string }) => access.locationId,
        ),
        isActive: result.isActive,
      },
    })

    // update last login
    await db
      .update(staff)
      .set({ lastLoginAt: new Date() })
      .where(eq(staff.id, user.id))
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useAppSession()
  await session.clear()
})

export const fetchStaff = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => {
    const session = await useAppSession()

    if (!session.data.user) {
      return null
    }

    return session.data.user
  },
)
