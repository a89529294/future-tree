import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/test')({
  component: TestPage,
})

function TestPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <Link
        to="/stores/$storeId"
        params={{ storeId: '279e6e08-5a74-48b8-a1f9-ae6ed4831d8e' }}
        className="text-blue-500 hover:text-blue-700 underline"
      >
        Go to Store 279e6e08-5a74-48b8-a1f9-ae6ed4831d8e
      </Link>
    </div>
  )
}
