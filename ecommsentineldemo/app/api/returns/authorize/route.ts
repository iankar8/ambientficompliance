import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderById, createRMAToken } from '@/lib/db/queries';
import { generateRMAToken } from '@/lib/synthetic';

const authorizeSchema = z.object({
  order_uuid: z.string().uuid(),
  sku: z.string(),
  reason_code: z.enum(['NOT_AS_DESCRIBED', 'DAMAGED', 'SIZE_FIT', 'CHANGED_MIND', 'OTHER']),
});

/**
 * POST /api/returns/authorize
 * Mint RMA token for return
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = authorizeSchema.parse(body);
    
    // Get order
    const order = await getOrderById(validated.order_uuid);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Verify SKU is in order
    const intent = order.intents;
    const itemExists = intent.items.some((item: any) => item.sku === validated.sku);
    if (!itemExists) {
      return NextResponse.json(
        { success: false, error: 'SKU not found in order' },
        { status: 400 }
      );
    }
    
    // Generate RMA token
    const rmaData = generateRMAToken(order.id, validated.sku);
    rmaData.reason_code = validated.reason_code;
    
    const rmaToken = await createRMAToken(rmaData);
    
    return NextResponse.json({
      success: true,
      data: {
        rma_id: rmaToken.rma_id,
        rma_uuid: rmaToken.id,
        order_id: order.order_id,
        sku: validated.sku,
        reason_code: validated.reason_code,
        label_url: rmaToken.label_url,
        expires_at: rmaToken.expires_at,
        policy_snapshot: rmaToken.policy_snapshot,
      },
    });
    
  } catch (error: any) {
    console.error('RMA authorize error:', error);
    
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
