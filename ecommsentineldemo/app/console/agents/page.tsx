import { getAllAgents } from '@/lib/db/queries';
import { formatDate } from '@/lib/utils';
import { Shield, AlertCircle, Ban } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  const agents = await getAllAgents();

  const getTrustBadge = (tier: string) => {
    switch (tier) {
      case 'trusted':
        return {
          icon: Shield,
          className: 'bg-green-100 text-green-800',
          label: 'Trusted',
        };
      case 'blocked':
        return {
          icon: Ban,
          className: 'bg-red-100 text-red-800',
          label: 'Blocked',
        };
      default:
        return {
          icon: AlertCircle,
          className: 'bg-yellow-100 text-yellow-800',
          label: 'Unknown',
        };
    }
  };

  // Group agents by trust tier
  const agentsByTier = {
    trusted: agents.filter((a: any) => a.trust_tier === 'trusted'),
    unknown: agents.filter((a: any) => a.trust_tier === 'unknown'),
    blocked: agents.filter((a: any) => a.trust_tier === 'blocked'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Agents</h1>
        <p className="text-muted-foreground mt-1">
          Manage agent trust tiers and access control
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trusted</p>
              <p className="text-2xl font-bold text-foreground">{agentsByTier.trusted.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unknown</p>
              <p className="text-2xl font-bold text-foreground">{agentsByTier.unknown.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Ban className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Blocked</p>
              <p className="text-2xl font-bold text-foreground">{agentsByTier.blocked.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {agents.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-muted-foreground">
              No agents yet. Run <code className="px-2 py-1 bg-gray-100 rounded">npm run demo-agent</code> to create test agents.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trust Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.map((agent: any) => {
                  const badge = getTrustBadge(agent.trust_tier);
                  const BadgeIcon = badge.icon;
                  
                  return (
                    <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm font-mono text-primary">
                          {agent.agent_id}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {agent.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {agent.contact}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                          <BadgeIcon className="h-3.5 w-3.5" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(agent.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
