import { supabase } from '@/lib/supabase/client';
import { Settings } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PoliciesPage() {
  const { data: policies } = await supabase
    .from('policies')
    .select('*, merchants(*)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Policies</h1>
        <p className="text-muted-foreground mt-1">
          View and manage agent access policies
        </p>
      </div>

      {/* Policies List */}
      <div className="space-y-6">
        {!policies || policies.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 px-6 py-12 text-center">
            <p className="text-muted-foreground">
              No policies yet. Run <code className="px-2 py-1 bg-gray-100 rounded">npm run seed</code> to create policies.
            </p>
          </div>
        ) : (
          policies.map((policy: any) => (
            <div key={policy.id} className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Settings className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {policy.merchants?.name || 'Unknown Merchant'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Version {policy.version} • Effective {new Date(policy.effective_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Allowlist */}
                {policy.rules.allowlist && policy.rules.allowlist.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Allowlist</h4>
                    <div className="flex flex-wrap gap-2">
                      {policy.rules.allowlist.map((agentId: string) => (
                        <code key={agentId} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-mono">
                          {agentId}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blocklist */}
                {policy.rules.blocklist && policy.rules.blocklist.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Blocklist</h4>
                    <div className="flex flex-wrap gap-2">
                      {policy.rules.blocklist.map((agentId: string) => (
                        <code key={agentId} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-mono">
                          {agentId}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {/* Limits */}
                {policy.rules.limits && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Limits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-1">Rate Limit</p>
                        <p className="text-lg font-semibold text-foreground">
                          {policy.rules.limits.rate_per_minute} req/min
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-1">Max Order Value</p>
                        <p className="text-lg font-semibold text-foreground">
                          ${(policy.rules.limits.max_order_value / 100).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-1">Daily Spend Cap</p>
                        <p className="text-lg font-semibold text-foreground">
                          ${(policy.rules.limits.daily_spend / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SPC Requirements */}
                {policy.rules.require_spc && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Strong Auth (SPC/3DS)</h4>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-foreground">
                        Required for orders above{' '}
                        <span className="font-semibold">
                          ${(policy.rules.require_spc.threshold / 100).toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Geo Restrictions */}
                {policy.rules.geo_restrictions && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Allowed Countries</h4>
                    <div className="flex flex-wrap gap-2">
                      {policy.rules.geo_restrictions.allowed_countries.map((country: string) => (
                        <span key={country} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {country}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw JSON (collapsible) */}
                <details className="mt-4">
                  <summary className="text-sm font-medium text-primary cursor-pointer hover:text-primary/80">
                    View Raw Policy JSON
                  </summary>
                  <pre className="mt-3 bg-gray-50 rounded-lg p-4 overflow-x-auto text-xs font-mono">
                    {JSON.stringify(policy.rules, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
