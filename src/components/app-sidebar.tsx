import { Building2, Cog, MapPin, SettingsIcon } from 'lucide-react'

import type { SidebarData } from '@/data/sidebar-data'
import { usePermission } from '@/hooks/use-permission'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from './ui/sidebar'

type AppSidebarProps = {
  data: SidebarData
}

export function AppSidebar({ data }: AppSidebarProps) {
  const canViewStores = usePermission('stores.view')
  const canViewLocations = usePermission('locations.view')
  const canViewMachines = usePermission('machines.view')

  // Group locations by store for display
  const storeMap = new Map<
    string,
    { storeName: string; locations: typeof data.locations }
  >()

  data.locations.forEach((location) => {
    const storeKey = location.storeId
    const existing = storeMap.get(storeKey)

    if (existing) {
      existing.locations.push(location)
    } else {
      storeMap.set(storeKey, {
        storeName: location.storeName,
        locations: [location],
      })
    }
  })

  const locationsByStore = Object.fromEntries(storeMap)

  return (
    <Sidebar>
      <SidebarContent>
        {/* Stores Section */}
        {canViewStores && data.stores.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Building2 className="mr-2 h-4 w-4" />
              Stores
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {data.stores.map((store) => (
                  <SidebarMenuItem key={store.id}>
                    <SidebarMenuButton asChild>
                      <a href={`/stores/${store.id}`}>
                        <span>{store.name}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Locations Section */}
        {canViewLocations && data.locations.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <MapPin className="mr-2 h-4 w-4" />
              Locations
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Object.entries(locationsByStore).map(
                  ([storeId, { storeName, locations }]) => (
                    <SidebarMenuItem key={storeId}>
                      <SidebarMenuButton className="font-medium text-muted-foreground cursor-default">
                        <span>{storeName}</span>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        {locations.map((location) => (
                          <SidebarMenuSubItem key={location.id}>
                            <SidebarMenuSubButton asChild>
                              <a href={`/locations/${location.id}`}>
                                <span>{location.name}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Machines Section - just a link for now */}
        {canViewMachines && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <SettingsIcon />
              <SidebarMenuButton asChild>
                <a href={'#'}>
                  <span>Machines</span>
                </a>
              </SidebarMenuButton>
            </SidebarGroupLabel>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
