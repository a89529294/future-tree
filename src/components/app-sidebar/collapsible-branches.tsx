import { useMatchRoute } from '@tanstack/react-router'
import { ChevronRight, Loader2, MapPin, PlusIcon } from 'lucide-react'
import { useRef, useState } from 'react'

import { RouterLink } from '@/components/router-link'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { useBranches } from '@/queries/branches'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  sidebarMenuButtonVariants,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '../ui/sidebar'

export function CollapsibleBranches() {
  const { data: branches } = useBranches()

  // Group branches by store for display
  const storeMap = new Map<
    string, // storeNumber
    { storeName: string; branches: typeof branches }
  >()

  branches.forEach((branch) => {
    const storeKey = branch.store.storeNumber
    const existing = storeMap.get(storeKey)

    if (existing) {
      existing.branches.push(branch)
    } else {
      storeMap.set(storeKey, {
        storeName: branch.store.name,
        branches: [branch],
      })
    }
  })

  const branchesByStore = Object.fromEntries(storeMap)

  const matchRoute = useMatchRoute()
  const matchBranchRoute = matchRoute({
    to: '/stores/$storeNumber/branches/$branchNumber',
    fuzzy: true,
  })
  const matchCreateBranchRoute = matchRoute({
    to: '/stores/$storeNumber/branches/create',
  })
  const isRouteMatched = !!matchBranchRoute || !!matchCreateBranchRoute

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
            <MapPin className="mr-2 h-4 w-4" />
            店家
            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:-rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.entries(branchesByStore).map(
                ([storeId, { storeName, branches: storeBranches }]) => {
                  return (
                    <SubCollapsible
                      key={storeId}
                      storeId={storeId}
                      storeName={storeName}
                      branches={storeBranches}
                    />
                  )
                },
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export function CollapsibleBranchesFallback() {
  return (
    <Collapsible open={false} className="group/collapsible opacity-50">
      <SidebarGroup>
        <SidebarGroupLabel asChild className="text-sm">
          <CollapsibleTrigger>
            <MapPin className="mr-2 h-4 w-4" />
            店家
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
      </SidebarGroup>
    </Collapsible>
  )
}

function SubCollapsible({
  storeId,
  storeName,
  branches: storeBranches,
}: {
  storeId: string
  storeName: string
  branches: Array<{
    id: string
    branchNumber: string
    name: string
  }>
}) {
  const matchRoute = useMatchRoute()
  const matchBranchRoute = matchRoute({
    to: '/stores/$storeNumber/branches/$branchNumber',
    fuzzy: true,
  })
  const matchCreateBranchRoute = matchRoute({
    to: '/stores/$storeNumber/branches/create',
  })
  const storeMatch =
    (typeof matchBranchRoute === 'object' &&
      matchBranchRoute.storeNumber === storeId) ||
    (typeof matchCreateBranchRoute === 'object' &&
      matchCreateBranchRoute.storeNumber === storeId)
  const storeMatchRef = useRef(storeMatch)
  const [open, setOpen] = useState(storeMatch)

  if (storeMatchRef.current !== storeMatch) {
    storeMatchRef.current = storeMatch
    setOpen(storeMatch)
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/sub-collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="cursor-default">
            <span>{storeName}</span>
            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/sub-collapsible:-rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {storeBranches.map((branch) => (
              <SidebarMenuSubItem key={branch.id}>
                <SidebarMenuSubButton
                  asChild
                  isActive={
                    typeof matchBranchRoute === 'object' &&
                    matchBranchRoute.storeNumber === storeId &&
                    matchBranchRoute.branchNumber === branch.branchNumber
                  }
                >
                  <RouterLink
                    to="/stores/$storeNumber/branches/$branchNumber"
                    params={{
                      storeNumber: storeId,
                      branchNumber: branch.branchNumber,
                    }}
                  >
                    <span>{branch.name}</span>
                  </RouterLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
            <SidebarMenuSubItem>
              <SidebarMenuSubButton asChild>
                <RouterLink
                  to="/stores/$storeNumber/branches/create"
                  params={{ storeNumber: storeId }}
                  className={cn(
                    sidebarMenuButtonVariants({
                      variant: 'outline',
                      size: 'default',
                    }),
                  )}
                >
                  <span className="flex items-center gap-2">
                    <PlusIcon className="h-3 w-3" />
                    新增店家
                  </span>
                </RouterLink>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
