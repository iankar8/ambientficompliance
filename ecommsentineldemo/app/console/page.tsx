import { ShoppingCart, Users, Package, Activity } from 'lucide-react';
import { getStats, getRecentSessions } from '@/lib/db/queries';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ConsoleDashboard() {
  const stats = await getStats();
  const recentSessions = await getRecentSessions(10);

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Active Agents',
      value: stats.totalAgents,
      icon: Users,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Pending Returns',
      value: stats.pendingReturns,
      icon: Package,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: 'Total Sessions',
      value: stats.totalSessions,
      icon: Activity,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your agentic commerce activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentSessions.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground">
              No activity yet. Run <code className="px-2 py-1 bg-gray-100 rounded">npm run demo-agent</code> to generate test data.
            </div>
          ) : (
            recentSessions.map((session: any) => (
              <div key={session.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {session.event_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      {session.agents && (
                        <span className="text-sm text-muted-foreground">
                          by {session.agents.name}
                        </span>
                      )}
                    </div>
                    {session.merchants && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Merchant: {session.merchants.name}
                      </p>
                    )}
                    {session.event_data && (
                      <pre className="text-xs text-muted-foreground mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(session.event_data, null, 2)}
                      </pre>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                    {formatDate(session.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
