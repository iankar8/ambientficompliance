import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/db/queries';

/**
 * GET /api/orders/:id
 * Fetch order with full evidence pack
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await getOrderById(params.id);
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: order,
    });
    
  } catch (error: any) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
