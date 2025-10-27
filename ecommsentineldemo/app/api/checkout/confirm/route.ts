import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getIntentById, updateIntentStatus, createOrder, createSession } from '@/lib/db/queries';
import { generateEvidencePack } from '@/lib/synthetic';
import { nanoid } from 'nanoid';

const confirmSchema = z.object({
  intent_uuid: z.string().uuid(),
  payment_method: z.string().optional().default('synthetic_card'),
});

/**
 * POST /api/checkout/confirm
 * Confirm payment and generate evidence pack
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = confirmSchema.parse(body);
    
    // Get intent
    const intent = await getIntentById(validated.intent_uuid);
    if (!intent) {
      return NextResponse.json(
        { success: false, error: 'Intent not found' },
        { status: 404 }
      );
    }
    
    if (intent.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Intent already ${intent.status}` },
        { status: 400 }
      );
    }
    
    // Check expiration
    if (new Date(intent.expires_at) < new Date()) {
      await updateIntentStatus(intent.id, 'expired');
      return NextResponse.json(
        { success: false, error: 'Intent expired' },
        { status: 400 }
      );
    }
    
    // Generate evidence pack
    const evidencePack = generateEvidencePack({
      intent_id: intent.intent_id,
      items: intent.items,
      totals: intent.totals,
      pay_url: intent.pay_url,
      adapter: intent.adapter,
      status: intent.status,
      expires_at: intent.expires_at,
    });
    
    // Create order
    const orderId = `order_${nanoid(16)}`;
    const order = await createOrder({
      order_id: orderId,
      intent_id: intent.id,
      psp_order_id: `psp_synthetic_${nanoid(16)}`,
      evidence_pack: evidencePack,
      policy_snapshot_url: `https://storage.synthetic.sentinel.test/policies/${nanoid(16)}.json`,
      status: 'completed',
    });
    
    // Update intent status
    await updateIntentStatus(intent.id, 'confirmed');
    
    // Log session event
    await createSession({
      agent_id: intent.agent_id,
      merchant_id: intent.merchant_id,
      event_type: 'checkout_confirm',
      event_data: {
        intent_id: intent.intent_id,
        order_id: orderId,
        total: intent.totals.total,
      },
      ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });
    
    return NextResponse.json({
      success: true,
      data: {
        order_id: orderId,
        order_uuid: order.id,
        intent_id: intent.intent_id,
        status: 'completed',
        evidence_pack: evidencePack,
        completed_at: new Date().toISOString(),
      },
    });
    
  } catch (error: any) {
    console.error('Checkout confirm error:', error);
    
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
