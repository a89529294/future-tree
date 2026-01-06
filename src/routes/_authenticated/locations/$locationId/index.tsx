import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/locations/$locationId/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/locations/$locationId/"!</div>
}
