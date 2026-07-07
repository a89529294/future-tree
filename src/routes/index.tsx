import { createFileRoute, redirect } from '@tanstack/react-router'

import { RouterLink } from '@/components/router-link'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({
        to: '/dashboard',
      })
    }

    throw redirect({
      to: '/admin/login',
    })
  },
  component: App,
})

function App() {
  return null
}
