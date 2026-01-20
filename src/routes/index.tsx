import { createFileRoute, redirect } from '@tanstack/react-router'

import { RouterLink } from '@/components/router-link'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
  component: App,
})

function App() {
  return (
    <div className="min-h-screen grid grid-rows-12 place-items-center">
      <div className="row-start-6">請掃QR Code</div>
      <div className="row-start-7">
        <RouterLink to="/admin/login">或登入</RouterLink>
      </div>
    </div>
  )
}
