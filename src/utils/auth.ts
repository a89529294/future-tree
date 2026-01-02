import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { staff } from '@/db/schema'
import { hashPassword } from '@/utils/password'
import { useAppSession } from '@/utils/session'

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    console.log(data.email)
    console.log(data.password)
    console.error('PM2 LOG TEST: Server starting...')

    // Find the user by email
    const users = await db
      .select()
      .from(staff)
      .where(eq(staff.email, data.email))
      .limit(1)

    const user = users[0]

    // Check if the user exists
    if (!user) {
      return {
        error: true,
        userNotFound: true,
        message: 'User not found',
      }
    }

    // Check if the user is active
    if (!user.isActive) {
      return {
        error: true,
        message: 'Account is inactive. Please contact an administrator.',
      }
    }

    // Check if the password is correct
    const hashedPassword = await hashPassword(data.password)

    console.log(data.password)
    console.log(hashedPassword)

    if (user.passwordHash !== hashedPassword) {
      return {
        error: true,
        message: 'Incorrect password',
      }
    }

    // Create a session
    const session = await useAppSession()

    console.log('yay?')

    // Store the user's email in the session
    await session.update({
      userEmail: user.email,
    })
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useAppSession()
  await session.clear()
})

export const fetchStaff = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await useAppSession()

    if (!session.data.userEmail) {
      return null
    }

    return {
      email: session.data.userEmail,
    }
  },
)
