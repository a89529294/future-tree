import 'dotenv/config'

import { useSession } from '@tanstack/react-start/server'

export type User = {
  email: string
  password: string
}

type SessionUser = {
  userEmail: User['email']
}

export function useAppSession() {
  return useSession<SessionUser>({
    name: 'staff-session',
    password: process.env.STAFF_COOKIE_SECRET!,
  })
}
