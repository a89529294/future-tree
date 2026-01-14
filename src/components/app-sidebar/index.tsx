import { Link } from '@tanstack/react-router'
import { StoreIcon } from 'lucide-react'

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
import type { SidebarData } from '@/data/sidebar'
import { usePermission } from '@/hooks/use-permission'

import { CollapsibleBranches } from './collapsible-branches'
import { CollapsibleStores } from './collapsible-stores'

type AppSidebarProps = {
  data: SidebarData
}

export function AppSidebar({ data }: AppSidebarProps) {
  const canViewStores = usePermission('stores.view')
  const canViewBranches = usePermission('branches.view')
  const canViewMachines = usePermission('machines.view')

  // Group branches by store for display
  const storeMap = new Map<
    string,
    { storeName: string; branches: typeof data.branches }
  >()

  data.branches.forEach((branch) => {
    const storeKey = branch.storeId
    const existing = storeMap.get(storeKey)

    if (existing) {
      existing.branches.push(branch)
    } else {
      storeMap.set(storeKey, {
        storeName: branch.storeName,
        branches: [branch],
      })
    }
  })

  const branchesByStore = Object.fromEntries(storeMap)

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex flex-row items-center px-4">
        <img className="size-10 object-contain" src="/future-tree-logo.png" />
        <span className="text-xl font-bold">未來樹</span>
      </SidebarHeader>
      <SidebarContent>
        {/* Stores Section */}
        {canViewStores && data.stores.length > 0 && (
          <CollapsibleStores stores={data.stores} />
        )}

        {/* Branches Section */}
        {canViewBranches && data.branches.length > 0 && (
          <CollapsibleBranches branchesByStore={branchesByStore} />
        )}

        {/* Machines Section - just a link for now */}
        {canViewMachines && (
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
                <Link to="/test">Test Page</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
