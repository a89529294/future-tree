import { useQuery } from '@tanstack/react-query'
import { Link, useMatch } from '@tanstack/react-router'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { readBranch } from '@/data/branches'
import { readStore } from '@/data/stores'

export function GlobalBreadcrumb() {
  const storeView = useMatch({
    from: '/_authenticated/stores/$storeNumber/',
    shouldThrow: false,
  })
  const storeCreate = useMatch({
    from: '/_authenticated/stores/create',
    shouldThrow: false,
  })
  const storeEdit = useMatch({
    from: '/_authenticated/stores/$storeNumber/edit',
    shouldThrow: false,
  })

  const branchView = useMatch({
    from: '/_authenticated/stores/$storeNumber/branches/$branchNumber/',
    shouldThrow: false,
  })
  const branchCreate = useMatch({
    from: '/_authenticated/stores/$storeNumber/branches/create',
    shouldThrow: false,
  })
  const branchEdit = useMatch({
    from: '/_authenticated/stores/$storeNumber/branches/$branchNumber/edit',
    shouldThrow: false,
  })

  const roomView = useMatch({
    from: '/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/$roomNumber/',
    shouldThrow: false,
  })
  const roomCreate = useMatch({
    from: '/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/create',
    shouldThrow: false,
  })
  const roomEdit = useMatch({
    from: '/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/$roomNumber/edit',
    shouldThrow: false,
  })

  const isStoreRoute = storeView || storeCreate || storeEdit
  const isBranchRoute = branchView || branchCreate || branchEdit
  const isRoomRoute = roomView || roomCreate || roomEdit

  const storeNumber =
    storeView?.params.storeNumber ||
    storeEdit?.params.storeNumber ||
    branchCreate?.params.storeNumber ||
    branchView?.params.storeNumber ||
    branchEdit?.params.storeNumber ||
    roomCreate?.params.storeNumber ||
    roomView?.params.storeNumber ||
    roomEdit?.params.storeNumber ||
    ''
  const branchNumber =
    branchView?.params.branchNumber ||
    branchEdit?.params.branchNumber ||
    roomCreate?.params.branchNumber ||
    roomView?.params.branchNumber ||
    roomEdit?.params.branchNumber ||
    ''
  const roomNumber =
    roomView?.params.roomNumber || roomEdit?.params.roomNumber || ''

  const { data: store } = useQuery({
    queryKey: ['store', storeNumber],
    queryFn: () => readStore({ data: storeNumber }),
    enabled: !!storeNumber,
  })

  const { data: branch } = useQuery({
    queryKey: ['branch', branchNumber],
    queryFn: () => readBranch({ data: branchNumber }),
    enabled: !!branchNumber,
  })

  const renderBreadcrumbs = () => {
    const items = [{ label: '首頁', href: '/', isCurrent: false }]

    if (isStoreRoute) {
      const storeName = storeCreate
        ? '建立店家'
        : store?.name || storeNumber || '店家'
      items.push({ label: storeName, href: '', isCurrent: true })
    } else if (isBranchRoute) {
      const storeName = store?.name || storeNumber || '店家'
      items.push({
        label: storeName,
        href: `/stores/${storeNumber}`,
        isCurrent: false,
      })
      const branchName = branchCreate
        ? '建立分店'
        : branch?.name || branchNumber || '分店'
      items.push({ label: branchName, href: '', isCurrent: true })
    } else if (isRoomRoute) {
      const storeName = store?.name || storeNumber || '店家'
      items.push({
        label: storeName,
        href: `/stores/${storeNumber}`,
        isCurrent: false,
      })
      const branchName = branch?.name || branchNumber || '分店'
      items.push({
        label: branchName,
        href: `/stores/${storeNumber}/branches/${branchNumber}`,
        isCurrent: false,
      })
      const roomName = roomCreate ? '建立房間' : roomNumber || '房間'
      items.push({ label: roomName, href: '', isCurrent: true })
    }

    return items
  }

  const breadcrumbItems = renderBreadcrumbs()

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <div key={index} className="flex items-center">
            <BreadcrumbItem>
              {item.isCurrent ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
