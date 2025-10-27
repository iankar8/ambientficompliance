import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreateAgent } from '@/lib/db/queries';
import { createSession } from '@/lib/db/queries';
import { nanoid } from 'nanoid';

const verifySchema = z.object({
  agent_name: z.string().min(1),
  agent_key: z.string().min(1),
  agent_contact: z.string().email().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST /api/agents/verify
 * Verify agent identity and return trust tier
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = verifySchema.parse(body);
    
    // Generate agent_id from name + key (deterministic)
    const agentId = `agent_${validated.agent_name.toLowerCase().replace(/\s+/g, '_')}_${validated.agent_key.slice(0, 8)}`;
    
    // Get or create agent
    const agent = await getOrCreateAgent(agentId, {
      name: validated.agent_name,
      contact: validated.agent_contact || `${validated.agent_name.toLowerCase()}@example.com`,
      public_key: `pk_${nanoid(32)}`,
      metadata: validated.metadata || {},
    });
    
    // Log session event
    await createSession({
      agent_id: agent.id,
      merchant_id: null, // No merchant context yet
      event_type: 'agent_verify',
      event_data: {
        agent_name: validated.agent_name,
        trust_tier: agent.trust_tier,
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });
    
    return NextResponse.json({
      success: true,
      data: {
        agent_id: agent.agent_id,
        agent_uuid: agent.id,
        name: agent.name,
        trust_tier: agent.trust_tier,
        verified_at: new Date().toISOString(),
      },
    });
    
  } catch (error: any) {
    console.error('Agent verify error:', error);
    
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
