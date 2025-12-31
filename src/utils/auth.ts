import { createServerFn } from '@tanstack/react-start'

import { hashPassword } from '@/utils/password'
import { useAppSession } from '@/utils/session'

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    // Find the user
    const user = {
      email: 'admin@example.com',
      password:
        '0394a2ede332c9a13eb82e9b24631604c31df978b4e2f0fbd2c549944f9d79a536ceea9b92c6170cbbf0153ef33a4ff57321e17b7a5fadc33f7023ddd325da47',
    }

    // Check if the user exists
    if (!user) {
      return {
        error: true,
        userNotFound: true,
        message: 'User not found',
      }
    }

    // Check if the password is correct
    const hashedPassword = await hashPassword(data.password)

    if (user.password !== hashedPassword) {
      return {
        error: true,
        message: 'Incorrect password',
      }
    }

    // Create a session
    const session = await useAppSession()

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

    if (!session.data.userEmail) return null

    return {
      email: session.data.userEmail,
    }
  },
)
