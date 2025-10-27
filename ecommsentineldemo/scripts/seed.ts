#!/usr/bin/env tsx

/**
 * Seed Script - Populate database with synthetic data
 * Usage: npm run seed
 */

import { supabase } from '../lib/supabase/client';
import {
  generateMerchant,
  generateProduct,
  generateAgent,
  generateMandate,
  generateIntent,
  generateEvidencePack,
  generateOrder,
  generateRMAToken,
  generateSession,
} from '../lib/synthetic';

async function seed() {
  console.log('🌱 Seeding database with synthetic data...\n');

  try {
    // 1. Create synthetic merchants
    console.log('Creating merchants...');
    const merchants = [];
    for (let i = 0; i < 3; i++) {
      const merchant = generateMerchant();
      const { data, error } = await supabase
        .from('merchants')
        .insert(merchant)
        .select()
        .single();
      
      if (error) throw error;
      merchants.push(data);
      console.log(`  ✓ ${data.name}`);
    }

    // 2. Create products for each merchant
    console.log('\nCreating products...');
    const allProducts: any[] = [];
    for (const merchant of merchants) {
      const products = [];
      for (let i = 0; i < 10; i++) {
        const product = generateProduct(merchant.id);
        products.push({ ...product, merchant_id: merchant.id });
      }
      
      const { data, error } = await supabase
        .from('products')
        .insert(products)
        .select();
      
      if (error) throw error;
      allProducts.push(...data);
      console.log(`  ✓ ${products.length} products for ${merchant.name}`);
    }

    // 3. Create agents
    console.log('\nCreating agents...');
    const agents = [];
    const trustTiers: Array<'trusted' | 'unknown' | 'blocked'> = ['trusted', 'trusted', 'unknown', 'unknown', 'blocked'];
    for (const tier of trustTiers) {
      const agent = generateAgent(tier);
      const { data, error } = await supabase
        .from('agents')
        .insert(agent)
        .select()
        .single();
      
      if (error) throw error;
      agents.push(data);
      console.log(`  ✓ ${data.name} (${data.trust_tier})`);
    }

    // 4. Create sample transactions (intents → orders)
    console.log('\nCreating sample transactions...');
    for (let i = 0; i < 5; i++) {
      const merchant = merchants[Math.floor(Math.random() * merchants.length)];
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const merchantProducts = allProducts.filter(p => p.merchant_id === merchant.id);
      
      // Create mandate
      const mandate = generateMandate(agent.id, merchant.id);
      const { data: mandateData, error: mandateError } = await supabase
        .from('mandates')
        .insert(mandate)
        .select()
        .single();
      
      if (mandateError) throw mandateError;

      // Create intent
      const intent = generateIntent(agent.id, merchant.id, merchantProducts);
      const { data: intentData, error: intentError } = await supabase
        .from('intents')
        .insert({ ...intent, mandate_id: mandateData.id })
        .select()
        .single();
      
      if (intentError) throw intentError;

      // Create order
      const evidencePack = generateEvidencePack(intent);
      const order = generateOrder(intentData.id, evidencePack);
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();
      
      if (orderError) throw orderError;

      // Update intent status
      await supabase
        .from('intents')
        .update({ status: 'confirmed' })
        .eq('id', intentData.id);

      console.log(`  ✓ Order ${orderData.order_id} (${agent.name} → ${merchant.name})`);

      // Create RMA token for some orders
      if (Math.random() > 0.5) {
        const sku = intent.items[0].sku;
        const rmaToken = generateRMAToken(orderData.id, sku);
        const { error: rmaError } = await supabase
          .from('rma_tokens')
          .insert(rmaToken);
        
        if (rmaError) throw rmaError;
        console.log(`    ↳ RMA token issued for ${sku}`);
      }

      // Create session events
      const sessionEvents = ['verify', 'intent', 'confirm'];
      for (const eventType of sessionEvents) {
        const session = generateSession(agent.id, merchant.id, eventType);
        await supabase.from('sessions').insert(session);
      }
    }

    // 5. Create policies
    console.log('\nCreating policies...');
    for (const merchant of merchants) {
      const policy = {
        merchant_id: merchant.id,
        rules: {
          allowlist: agents.filter(a => a.trust_tier === 'trusted').map(a => a.agent_id),
          blocklist: agents.filter(a => a.trust_tier === 'blocked').map(a => a.agent_id),
          limits: {
            rate_per_minute: 10,
            max_order_value: 100000, // cents
            daily_spend: 500000, // cents
          },
          require_spc: {
            enabled: true,
            threshold: 30000, // cents ($300)
          },
          geo_restrictions: {
            allowed_countries: ['US', 'CA', 'UK'],
          },
        },
        version: 1,
      };
      
      const { error } = await supabase.from('policies').insert(policy);
      if (error) throw error;
      console.log(`  ✓ Policy for ${merchant.name}`);
    }

    console.log('\n✅ Seed completed successfully!');
    console.log(`\nCreated:`);
    console.log(`  • ${merchants.length} merchants`);
    console.log(`  • ${allProducts.length} products`);
    console.log(`  • ${agents.length} agents`);
    console.log(`  • 5 sample transactions`);
    console.log(`  • ${merchants.length} policies`);
    console.log(`\n🚀 Run "npm run dev" to start the application`);

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
