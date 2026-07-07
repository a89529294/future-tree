import { StoreIcon } from 'lucide-react'
import { Suspense } from 'react'

import { RouterLink } from '@/components/router-link'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { usePermission } from '@/hooks/use-permission'

import {
  CollapsibleBranches,
  CollapsibleBranchesFallback,
} from './collapsible-branches'
import {
  CollapsibleStores,
  CollapsibleStoresFallback,
} from './collapsible-stores'

export function AppSidebar() {
  const canReadStores = usePermission('stores.read')
  const canReadBranches = usePermission('branches.read')
  const canReadMachines = usePermission('machines.read')

  return (
    <Sidebar>
      <SidebarHeader className="h-16">
        <RouterLink
          to="/"
          className="h-full flex flex-row items-center cursor-pointer gap-2 "
        >
          <img className="size-10 object-contain" src="/future-tree-logo.png" />
          <span className="text-xl font-bold">未來樹</span>
        </RouterLink>
      </SidebarHeader>
      <SidebarContent>
        {/* Stores Section */}
        {canReadStores && (
          <Suspense fallback={<CollapsibleStoresFallback />}>
            <CollapsibleStores />
          </Suspense>
        )}

        {/* Branches Section */}
        {/* {canReadBranches && (
          <Suspense fallback={<CollapsibleBranchesFallback />}>
            <CollapsibleBranches />
          </Suspense>
        )} */}

        {/* Machines Section - just a link for now */}
        {canReadMachines && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <StoreIcon />
              <SidebarMenuButton asChild>
                <a href={'#'}>
                  <span>販賣機</span>
                </a>
              </SidebarMenuButton>
            </SidebarGroupLabel>
          </SidebarGroup>
        )}

        {/* Test Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Test</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <RouterLink to="/test">Test Page</RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
