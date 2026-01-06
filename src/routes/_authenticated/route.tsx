import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import type { FormEvent } from 'react'

import { AppSidebar } from '@/components/app-sidebar'
import { Button } from '@/components/ui/button'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { fetchSidebarData } from '@/data/sidebar-data'
import { logoutFn } from '@/utils/auth/authenticate'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({
        to: '/admin/login',
      })
    }
  },
  loader: async () => {
    const sidebarData = await fetchSidebarData()
    return { sidebarData }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { sidebarData } = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const navigate = Route.useNavigate()

  const onLogout = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await logoutFn()
    navigate({ to: '/admin/login' })
  }

  return (
    <SidebarProvider>
      <AppSidebar data={sidebarData} />
      <main className="flex-1">
        <div className="flex items-center justify-between border-b h-16 px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-4">
            <div className=" font-medium">
              {user?.firstName} {user?.lastName}
            </div>
            <form onSubmit={onLogout}>
              <Button className="cursor-pointer">登出</Button>
            </form>
          </div>
        </div>
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  )
}
