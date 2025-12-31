import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardComponent,
})

function DashboardComponent() {
  const { user } = Route.useRouteContext()

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Admin Dashboard</h1>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-xl text-gray-300">
            Welcome back,{' '}
            <span className="text-cyan-400 font-semibold">{user?.email}</span>!
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2 text-white">
                System Status
              </h2>
              <p className="text-gray-400 text-sm">All systems operational.</p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2 text-white">
                Recent Activity
              </h2>
              <p className="text-gray-400 text-sm">No recent alerts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
