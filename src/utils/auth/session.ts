import { useSession } from '@tanstack/react-start/server'

import type { SessionState } from './types-and-constants'

export function useAppSession() {
  return useSession<SessionState>({
    name: 'staff-session',
    password: process.env.STAFF_COOKIE_SECRET!,
  })
}
