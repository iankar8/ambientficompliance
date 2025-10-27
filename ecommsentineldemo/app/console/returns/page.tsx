import { getAllRMATokens } from '@/lib/db/queries';
import { formatDate } from '@/lib/utils';
import { Package, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReturnsPage() {
  const rmaTokens = await getAllRMATokens(50);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      issued: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-yellow-100 text-yellow-800',
      received: 'bg-purple-100 text-purple-800',
      refunded: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getReasonLabel = (code: string) => {
    const labels: Record<string, string> = {
      NOT_AS_DESCRIBED: 'Not as Described',
      DAMAGED: 'Damaged',
      SIZE_FIT: 'Size/Fit Issue',
      CHANGED_MIND: 'Changed Mind',
      OTHER: 'Other',
    };
    return labels[code] || code;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Returns</h1>
        <p className="text-muted-foreground mt-1">
          Manage RMA tokens and return authorizations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {['issued', 'in_transit', 'received', 'refunded'].map((status) => {
          const count = rmaTokens.filter((rma: any) => rma.status === status).length;
          return (
            <div key={status} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground capitalize">{status.replace('_', ' ')}</p>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* RMA Tokens Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {rmaTokens.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-muted-foreground">
              No returns yet. Returns are created automatically during the demo flow.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RMA ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issued
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Label
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rmaTokens.map((rma: any) => (
                  <tr key={rma.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm font-mono text-primary">
                        {rma.rma_id}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm font-mono text-muted-foreground">
                        {rma.orders?.order_id || 'N/A'}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-foreground">
                      {rma.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {getReasonLabel(rma.reason_code)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(rma.status)}`}>
                        {rma.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(rma.issued_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {rma.label_url ? (
                        <a
                          href={rma.label_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
                        >
                          View
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
