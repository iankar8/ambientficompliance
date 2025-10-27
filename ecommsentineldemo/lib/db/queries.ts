/**
 * Database Query Helpers
 * Type-safe wrappers for Supabase queries
 */

import { supabase } from '../supabase/client';

// Merchants
export async function getMerchantByApiKey(apiKey: string) {
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('api_key', apiKey)
    .single();
  
  if (error) throw new Error(`Merchant not found: ${error.message}`);
  return data;
}

export async function getAllMerchants() {
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Agents
export async function getOrCreateAgent(agentId: string, agentData: any) {
  // Try to get existing agent
  const { data: existing } = await supabase
    .from('agents')
    .select('*')
    .eq('agent_id', agentId)
    .single();
  
  if (existing) return existing;
  
  // Create new agent
  const { data, error } = await supabase
    .from('agents')
    .insert({
      agent_id: agentId,
      name: agentData.name,
      contact: agentData.contact,
      public_key: agentData.public_key,
      trust_tier: 'unknown',
      metadata: agentData.metadata || {},
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAgentById(id: string) {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAllAgents() {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function updateAgentTrustTier(id: string, tier: 'trusted' | 'unknown' | 'blocked') {
  const { data, error } = await supabase
    .from('agents')
    .update({ trust_tier: tier })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Mandates
export async function createMandate(mandateData: any) {
  const { data, error } = await supabase
    .from('mandates')
    .insert(mandateData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Intents
export async function createIntent(intentData: any) {
  const { data, error } = await supabase
    .from('intents')
    .insert(intentData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getIntentById(id: string) {
  const { data, error } = await supabase
    .from('intents')
    .select('*, agents(*), merchants(*)')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateIntentStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('intents')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Orders
export async function createOrder(orderData: any) {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getOrderById(id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, intents(*, agents(*), merchants(*))')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAllOrders(limit = 50) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, intents(*, agents(*), merchants(*))')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

// RMA Tokens
export async function createRMAToken(rmaData: any) {
  const { data, error } = await supabase
    .from('rma_tokens')
    .insert(rmaData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAllRMATokens(limit = 50) {
  const { data, error } = await supabase
    .from('rma_tokens')
    .select('*, orders(*, intents(*, merchants(*)))')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

// Policies
export async function getPolicyByMerchantId(merchantId: string) {
  const { data, error } = await supabase
    .from('policies')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('version', { ascending: false })
    .limit(1)
    .single();
  
  if (error) return null; // No policy yet
  return data;
}

// Sessions
export async function createSession(sessionData: any) {
  const { data, error } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getRecentSessions(limit = 20) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*, agents(*), merchants(*)')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

// Products
export async function getProductsByMerchantId(merchantId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('merchant_id', merchantId);
  
  if (error) throw error;
  return data || [];
}

// Stats
export async function getStats() {
  const [orders, agents, rmaTokens, sessions] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('agents').select('id', { count: 'exact', head: true }),
    supabase.from('rma_tokens').select('id', { count: 'exact', head: true }),
    supabase.from('sessions').select('id', { count: 'exact', head: true }),
  ]);
  
  return {
    totalOrders: orders.count || 0,
    totalAgents: agents.count || 0,
    pendingReturns: rmaTokens.count || 0,
    totalSessions: sessions.count || 0,
  };
}
