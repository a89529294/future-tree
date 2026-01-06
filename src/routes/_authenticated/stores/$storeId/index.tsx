import { createFileRoute } from '@tanstack/react-router'

import { StoreForm } from '@/components/stores/store-form'

// Mock data fetcher
const fetchStore = async (id: string) => {
  // Simulating an API call
  await new Promise((resolve) => setTimeout(resolve, 100))
  return {
    id,
    name: 'Main Street Bakery',
    address: '123 Main St, Springfield, IL 62701',
    phoneNumber: '217-555-0123',
  }
}

export const Route = createFileRoute('/_authenticated/stores/$storeId/')({
  loader: async ({ params }) => {
    const store = await fetchStore(params.storeId)
    return { store }
  },
  component: StoreDetailComponent,
})

function StoreDetailComponent() {
  const { store } = Route.useLoaderData()
  const { storeId } = Route.useParams()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">檢視廠商</h1>
      </div>
      <StoreForm
        initialData={{
          ...store,
          isReadOnly: true,
        }}
      />
    </div>
  )
}
