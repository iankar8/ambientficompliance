#!/usr/bin/env tsx

/**
 * Demo Agent - Simulates complete checkout flow
 * Usage: npm run demo-agent
 */

import { supabase } from '../lib/supabase/client';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step: number, title: string) {
  console.log(`\n${colors.bright}${colors.blue}━━━ Step ${step}: ${title} ━━━${colors.reset}\n`);
}

function logSuccess(message: string) {
  log(`✓ ${message}`, colors.green);
}

function logInfo(key: string, value: any) {
  console.log(`${colors.cyan}  ${key}:${colors.reset} ${JSON.stringify(value, null, 2)}`);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDemo() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════╗', colors.bright);
  log('║         SENTINEL - Agentic Commerce Demo Agent            ║', colors.bright);
  log('╚════════════════════════════════════════════════════════════╝', colors.bright);
  
  try {
    // Step 1: Get a merchant
    logStep(1, 'Fetching Merchant');
    const { data: merchants } = await supabase
      .from('merchants')
      .select('*')
      .limit(1)
      .single();
    
    if (!merchants) {
      throw new Error('No merchants found. Run: npm run seed');
    }
    
    logSuccess('Merchant found');
    logInfo('Merchant', {
      name: merchants.name,
      domain: merchants.domain,
      api_key: merchants.api_key.slice(0, 20) + '...',
    });
    
    await sleep(500);
    
    // Step 2: Verify Agent
    logStep(2, 'Agent Verification');
    const verifyResponse = await fetch(`${API_BASE}/api/agents/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_name: 'DemoBot',
        agent_key: 'demo_key_12345',
        agent_contact: 'demobot@sentinel.test',
        metadata: {
          version: '1.0.0',
          capabilities: ['checkout', 'returns'],
        },
      }),
    });
    
    const verifyData = await verifyResponse.json();
    if (!verifyData.success) {
      throw new Error(`Verify failed: ${verifyData.error}`);
    }
    
    logSuccess('Agent verified');
    logInfo('Agent', {
      agent_id: verifyData.data.agent_id,
      trust_tier: verifyData.data.trust_tier,
    });
    
    const agentUuid = verifyData.data.agent_uuid;
    
    await sleep(500);
    
    // Step 3: Get products
    logStep(3, 'Browsing Products');
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', merchants.id)
      .limit(3);
    
    if (!products || products.length === 0) {
      throw new Error('No products found');
    }
    
    logSuccess(`Found ${products.length} products`);
    products.forEach((p, i) => {
      log(`  ${i + 1}. ${p.name} - $${(p.price_value / 100).toFixed(2)}`, colors.yellow);
    });
    
    await sleep(500);
    
    // Step 4: Create checkout intent
    logStep(4, 'Creating Checkout Intent');
    const selectedProducts = products.slice(0, 2);
    const intentResponse = await fetch(`${API_BASE}/api/checkout/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_uuid: agentUuid,
        merchant_api_key: merchants.api_key,
        items: selectedProducts.map(p => ({
          sku: p.sku,
          qty: 1,
        })),
      }),
    });
    
    const intentData = await intentResponse.json();
    if (!intentData.success) {
      throw new Error(`Intent failed: ${intentData.error}`);
    }
    
    logSuccess('Checkout intent created');
    logInfo('Intent', {
      intent_id: intentData.data.intent_id,
      items: intentData.data.items.length,
      total: `$${(intentData.data.totals.total / 100).toFixed(2)}`,
    });
    logInfo('Pay URL', intentData.data.pay_url);
    
    const intentUuid = intentData.data.intent_uuid;
    
    await sleep(1000);
    
    // Step 5: Simulate payment
    logStep(5, 'Processing Payment (Synthetic)');
    log('  💳 Simulating payment...', colors.magenta);
    await sleep(1500);
    
    const confirmResponse = await fetch(`${API_BASE}/api/checkout/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent_uuid: intentUuid,
        payment_method: 'synthetic_card',
      }),
    });
    
    const confirmData = await confirmResponse.json();
    if (!confirmData.success) {
      throw new Error(`Confirm failed: ${confirmData.error}`);
    }
    
    logSuccess('Payment confirmed!');
    logInfo('Order', {
      order_id: confirmData.data.order_id,
      status: confirmData.data.status,
    });
    
    await sleep(500);
    
    // Step 6: View evidence pack
    logStep(6, 'Evidence Pack Generated');
    const evidence = confirmData.data.evidence_pack;
    logSuccess('Evidence pack complete');
    logInfo('Mandate', {
      policy_url: evidence.mandate.policy_url,
      consent_timestamp: evidence.mandate.consent_timestamp,
    });
    logInfo('Auth', {
      method: evidence.auth.method,
      result: evidence.auth.result,
    });
    logInfo('PSP Receipt', {
      charge_id: evidence.psp_receipt.charge_id,
      risk_score: evidence.psp_receipt.risk_score,
    });
    
    await sleep(500);
    
    // Step 7: Optional - Create RMA token
    logStep(7, 'Initiating Return (Optional)');
    const returnSku = selectedProducts[0].sku;
    const rmaResponse = await fetch(`${API_BASE}/api/returns/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_uuid: confirmData.data.order_uuid,
        sku: returnSku,
        reason_code: 'CHANGED_MIND',
      }),
    });
    
    const rmaData = await rmaResponse.json();
    if (rmaData.success) {
      logSuccess('RMA token issued');
      logInfo('RMA', {
        rma_id: rmaData.data.rma_id,
        sku: rmaData.data.sku,
        label_url: rmaData.data.label_url,
      });
    }
    
    // Summary
    console.log(`\n${colors.bright}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    log('✓ Demo completed successfully!', colors.bright + colors.green);
    console.log(`${colors.bright}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    log('Next steps:', colors.cyan);
    log('  • Open http://localhost:3000/console to view the order', colors.reset);
    log('  • Check the evidence pack in the UI', colors.reset);
    log('  • View real-time session activity', colors.reset);
    
  } catch (error: any) {
    console.error(`\n${colors.bright}❌ Demo failed:${colors.reset}`, error.message);
    console.error('\nMake sure:');
    console.error('  1. Supabase is configured (.env.local)');
    console.error('  2. Database is seeded (npm run seed)');
    console.error('  3. Dev server is running (npm run dev)');
    process.exit(1);
  }
}

runDemo();
