import { createServerFn } from '@tanstack/react-start'

import { hashPassword } from '@/utils/password'
import { useAppSession } from '@/utils/session'

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    console.log(data.email)
    console.log(data.password)
    console.error('PM2 LOG TEST: Server starting...')

    // Find the user
    const user = {
      email: 'admin@example.com',
      password:
        'f91554cd2040c2ddcf788d2a839d758147abece62d76149d82e9a204f26764bec446f754318c9741c191368143cd1c3335e9586b6f626a41d78356e1ac2ae492',
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
