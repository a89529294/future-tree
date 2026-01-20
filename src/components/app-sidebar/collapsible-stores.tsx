import { useMatchRoute } from '@tanstack/react-router'
import { Building2, ChevronRight, Loader2, PlusIcon } from 'lucide-react'
import { useRef, useState } from 'react'

import { RouterLink } from '@/components/router-link'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useStores } from '@/queries/stores'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar'

export function CollapsibleStores() {
  const { data: stores } = useStores()
  const matchRoute = useMatchRoute()
  const matchViewRoute = matchRoute({
    to: '/stores/$storeNumber',
  })
  const matchEditRoute = matchRoute({ to: '/stores/$storeNumber/edit' })
  const matchCreateRoute = !!matchRoute({ to: '/stores/create' })

  const isRouteMatched =
    !!matchViewRoute || !!matchEditRoute || matchCreateRoute

  const prevRouteMatchedRef = useRef(isRouteMatched)
  const [open, setOpen] = useState(isRouteMatched)

  if (prevRouteMatchedRef.current !== isRouteMatched) {
    prevRouteMatchedRef.current = isRouteMatched
    setOpen(isRouteMatched)
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarGroup>
        <SidebarGroupLabel asChild className="text-sm">
          <CollapsibleTrigger>
            <Building2 className="mr-2 h-4 w-4" />
            集團
            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:-rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {stores.map((store) => (
                <SidebarMenuItem key={store.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      (typeof matchViewRoute === 'object' &&
                        matchViewRoute.storeNumber === store.storeNumber) ||
                      (typeof matchEditRoute === 'object' &&
                        matchEditRoute.storeNumber === store.storeNumber)
                    }
                  >
                    <RouterLink
                      to={'/stores/$storeNumber'}
                      params={{ storeNumber: store.storeNumber }}
                      preload={false}
                    >
                      <span>{store.name}</span>
                    </RouterLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem key={'new-store'}>
                <SidebarMenuButton variant={'outline'} asChild>
                  <RouterLink
                    to="/stores/create"
                    className="flex justify-between"
                  >
                    新增集團 <PlusIcon />
                  </RouterLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export function CollapsibleStoresFallback() {
  return (
    <Collapsible open={false} className="group/collapsible opacity-50">
      <SidebarGroup>
        <SidebarGroupLabel asChild className="text-sm">
          <CollapsibleTrigger>
            <Building2 className="mr-2 h-4 w-4" />
            集團
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
      </SidebarGroup>
    </Collapsible>
  )
}
