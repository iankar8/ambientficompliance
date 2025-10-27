import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrderById } from '@/lib/db/queries';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Download } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  let order;
  try {
    order = await getOrderById(params.id);
  } catch (error) {
    notFound();
  }

  if (!order) {
    notFound();
  }

  const intent = order.intents;
  const agent = intent?.agents;
  const merchant = intent?.merchants;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/console/orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Order Details</h1>
            <p className="text-muted-foreground mt-1">
              <code className="text-sm font-mono">{order.order_id}</code>
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Download className="h-4 w-4" />
          Download Evidence Pack
        </button>
      </div>

      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Agent</h3>
          <p className="text-lg font-semibold text-foreground">{agent?.name || 'Unknown'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Trust Tier: <span className="font-medium">{agent?.trust_tier || 'unknown'}</span>
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Merchant</h3>
          <p className="text-lg font-semibold text-foreground">{merchant?.name || 'Unknown'}</p>
          <p className="text-sm text-muted-foreground mt-1">{merchant?.domain || 'N/A'}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total</h3>
          <p className="text-lg font-semibold text-foreground">
            {intent?.totals?.total ? formatCurrency(intent.totals.total) : 'N/A'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(order.created_at)}
          </p>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-foreground">Order Items</h2>
        </div>
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-muted-foreground">SKU</th>
                <th className="text-left py-2 text-sm font-medium text-muted-foreground">Product</th>
                <th className="text-right py-2 text-sm font-medium text-muted-foreground">Qty</th>
                <th className="text-right py-2 text-sm font-medium text-muted-foreground">Price</th>
                <th className="text-right py-2 text-sm font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {intent?.items?.map((item: any, index: number) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 text-sm font-mono text-muted-foreground">{item.sku}</td>
                  <td className="py-3 text-sm text-foreground">{item.name}</td>
                  <td className="py-3 text-sm text-right text-foreground">{item.qty}</td>
                  <td className="py-3 text-sm text-right text-foreground">
                    {formatCurrency(item.price.value)}
                  </td>
                  <td className="py-3 text-sm text-right font-medium text-foreground">
                    {formatCurrency(item.price.value * item.qty)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-200">
                <td colSpan={4} className="py-2 text-sm text-right text-muted-foreground">Subtotal</td>
                <td className="py-2 text-sm text-right text-foreground">
                  {formatCurrency(intent?.totals?.subtotal || 0)}
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="py-2 text-sm text-right text-muted-foreground">Tax</td>
                <td className="py-2 text-sm text-right text-foreground">
                  {formatCurrency(intent?.totals?.tax || 0)}
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="py-2 text-sm text-right text-muted-foreground">Shipping</td>
                <td className="py-2 text-sm text-right text-foreground">
                  {formatCurrency(intent?.totals?.shipping || 0)}
                </td>
              </tr>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={4} className="py-2 text-sm text-right font-semibold text-foreground">Total</td>
                <td className="py-2 text-sm text-right font-bold text-foreground">
                  {formatCurrency(intent?.totals?.total || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Pack */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-foreground">Evidence Pack</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Complete evidence bundle for dispute defense
          </p>
        </div>
        <div className="p-6">
          <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-xs font-mono">
            {JSON.stringify(order.evidence_pack, null, 2)}
          </pre>
        </div>
      </div>

      {/* PSP Details */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-foreground">PSP Details</h2>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">PSP Order ID</span>
            <code className="text-sm font-mono text-foreground">{order.psp_order_id}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Adapter</span>
            <span className="text-sm font-medium text-foreground">{intent?.adapter || 'synthetic'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Policy Snapshot</span>
            <a href={order.policy_snapshot_url} className="text-sm text-primary hover:underline">
              View Policy
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              order.status === 'completed' 
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {order.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
