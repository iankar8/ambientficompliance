import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAgentById, getMerchantByApiKey, getProductsByMerchantId, createIntent, createSession } from '@/lib/db/queries';
import { nanoid } from 'nanoid';

const intentSchema = z.object({
  agent_uuid: z.string().uuid(),
  merchant_api_key: z.string(),
  items: z.array(z.object({
    sku: z.string(),
    qty: z.number().int().positive(),
  })).min(1),
});

/**
 * POST /api/checkout/intent
 * Create checkout intent and return synthetic pay URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = intentSchema.parse(body);
    
    // Verify agent exists
    const agent = await getAgentById(validated.agent_uuid);
    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }
    
    // Verify merchant
    const merchant = await getMerchantByApiKey(validated.merchant_api_key);
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Invalid merchant API key' },
        { status: 401 }
      );
    }
    
    // Get merchant products
    const products = await getProductsByMerchantId(merchant.id);
    const productMap = new Map(products.map(p => [p.sku, p]));
    
    // Build cart items
    const items = validated.items.map(item => {
      const product = productMap.get(item.sku);
      if (!product) {
        throw new Error(`Product not found: ${item.sku}`);
      }
      
      if (product.inventory_available < item.qty) {
        throw new Error(`Insufficient inventory for ${item.sku}`);
      }
      
      return {
        sku: product.sku,
        name: product.name,
        qty: item.qty,
        price: {
          value: product.price_value,
          currency: product.price_currency,
        },
      };
    });
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price.value * item.qty, 0);
    const tax = Math.round(subtotal * 0.08); // 8% tax
    const shipping = 999; // $9.99 flat rate
    const total = subtotal + tax + shipping;
    
    // Create intent
    const intentId = `intent_${nanoid(16)}`;
    const payUrl = `https://checkout.synthetic.sentinel.test/pay/${nanoid(24)}`;
    
    const intent = await createIntent({
      intent_id: intentId,
      agent_id: agent.id,
      merchant_id: merchant.id,
      items,
      totals: {
        subtotal,
        tax,
        shipping,
        total,
        currency: 'USD',
      },
      pay_url: payUrl,
      adapter: 'synthetic',
      status: 'pending',
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
    });
    
    // Log session event
    await createSession({
      agent_id: agent.id,
      merchant_id: merchant.id,
      event_type: 'checkout_intent',
      event_data: {
        intent_id: intentId,
        items_count: items.length,
        total,
      },
      ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });
    
    return NextResponse.json({
      success: true,
      data: {
        intent_id: intentId,
        intent_uuid: intent.id,
        pay_url: payUrl,
        items,
        totals: {
          subtotal,
          tax,
          shipping,
          total,
          currency: 'USD',
        },
        expires_at: intent.expires_at,
        adapter: 'synthetic',
      },
    });
    
  } catch (error: any) {
    console.error('Checkout intent error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
