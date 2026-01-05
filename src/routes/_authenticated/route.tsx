import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { fetchSidebarData } from '@/data/sidebar-data'

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

  return (
    <SidebarProvider>
      <AppSidebar data={sidebarData} />
      <main className="flex-1">
        <div className="flex items-center gap-2 p-4 border-b">
          <SidebarTrigger />
        </div>
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  )
}
