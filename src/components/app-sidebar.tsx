import { Link, useLocation } from '@tanstack/react-router'
import {
  Building2,
  ChevronDown,
  ChevronRight,
  MapPin,
  PlusIcon,
  StoreIcon,
} from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { SidebarData, SidebarStore } from '@/data/sidebar-data'
import { usePermission } from '@/hooks/use-permission'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
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
      <SidebarHeader className="h-16 flex flex-row items-center px-4">
        <img className="size-10 object-contain" src="/future-tree-logo.png" />
        <span className="text-xl font-bold">科技樹</span>
      </SidebarHeader>
      <SidebarContent>
        {/* Stores Section */}
        {canViewStores && data.stores.length > 0 && (
          <CollapsibleStores stores={data.stores} />
        )}

        {/* Locations Section */}
        {canViewLocations && data.locations.length > 0 && (
          <Collapsible className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild className="text-sm">
                <CollapsibleTrigger>
                  <MapPin className="mr-2 h-4 w-4" />
                  地點
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {Object.entries(locationsByStore).map(
                      ([storeId, { storeName, locations }]) => (
                        <Collapsible className="group/sub-collapsible">
                          <SidebarMenuItem key={storeId}>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton className=" cursor-default">
                                <span>{storeName}</span>
                                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/sub-collapsible:-rotate-90" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {locations.map((location) => (
                                  <SidebarMenuSubItem key={location.id}>
                                    <SidebarMenuSubButton asChild>
                                      <Link
                                        to="/locations/$locationId"
                                        params={{ locationId: location.id }}
                                      >
                                        <span>{location.name}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      ),
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
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
      </SidebarContent>
    </Sidebar>
  )
}

function CollapsibleStores({ stores }: { stores: Array<SidebarStore> }) {
  const pathname = useLocation({
    select: (location) => location.pathname,
  })

  return (
    <Collapsible
      defaultOpen={stores.some((s) => pathname.startsWith(`/stores/${s.id}`))}
      className="group/collapsible"
    >
      <SidebarGroup>
        <SidebarGroupLabel asChild className="text-sm">
          <CollapsibleTrigger>
            <Building2 className="mr-2 h-4 w-4" />
            廠商
            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {stores.map((store) => (
                <SidebarMenuItem key={store.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/stores/${store.id}`)}
                  >
                    <Link
                      to={'/stores/$storeId'}
                      params={{ storeId: store.id }}
                    >
                      <span>{store.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem key={'new-store'}>
                <SidebarMenuButton variant={'outline'} asChild>
                  <Link to="/stores/new" className="flex justify-between">
                    新增廠商 <PlusIcon />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}
