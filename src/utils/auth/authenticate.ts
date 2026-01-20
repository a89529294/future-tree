import { createServerFn } from '@tanstack/react-start'
import { eq, lt } from 'drizzle-orm'

import { db } from '@/db'
import { loggedInStaff, staff } from '@/db/schemas'
import { hashPassword } from '@/utils/auth/password'
import { useAppSession } from '@/utils/auth/session'

import type { LoginUser, SessionUser } from './types-and-constants'
import { expiresInMilliseconds } from './types-and-constants'

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
        roleAssignment: {
          with: {
            role: true,
          },
        },
        scopes: {
          with: {
            store: true,
            branch: true,
          },
        },
        permissions: true,
      },
    })

    if (!result) {
      throw new Error('Impossible condition')
    }

    const role = result.roleAssignment.role.name

    // Determine scopeType based on role
    const scopeType: SessionUser['scopeType'] =
      role === 'super_admin'
        ? 'global'
        : role === 'store_admin'
          ? 'store'
          : 'branch'

    // Create a session
    const session = await useAppSession()

    session.update({
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        role: role,
        scopeType,
        permissions: result.permissions.map(
          (p: { permission: string }) => p.permission,
        ),
        scopes:
          scopeType === 'global'
            ? []
            : result.scopes.map((scope) =>
                scopeType === 'store'
                  ? scope.store.storeNumber
                  : scope.branch!.branchNumber,
              ),
        isActive: result.isActive,
      },
    })

    // delete all entry in loggedInStaff if exists
    await db.delete(loggedInStaff).where(eq(loggedInStaff.staffId, result.id))

    // Insert new record
    await db.insert(loggedInStaff).values({
      staffId: result.id,
      expiresAt: new Date(Date.now() + expiresInMilliseconds),
    })

    // update last login
    await db
      .update(staff)
      .set({ lastLoginAt: new Date() })
      .where(eq(staff.id, user.id))
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useAppSession()

  if (session.data.user) {
    await db
      .delete(loggedInStaff)
      .where(eq(loggedInStaff.staffId, session.data.user.id))
  }

  await session.clear()
})

export const fetchStaff = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => {
    const session = await useAppSession()

    // cookie expired or not even set yet
    if (!session.data.user) {
      // Clear all expired entries in loggedInStaff
      await db
        .delete(loggedInStaff)
        .where(lt(loggedInStaff.expiresAt, new Date()))
      return null
    }

    const sessionRecord = await db.query.loggedInStaff.findFirst({
      where: eq(loggedInStaff.staffId, session.data.user.id),
    })

    // If no session found in database, clear the session and return null
    if (!sessionRecord) {
      await session.clear()
      return null
    }

    return session.data.user
  },
)
