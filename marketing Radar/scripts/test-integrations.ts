/**
 * Integration Test Script
 * Run this to verify all integrations are working
 * 
 * Usage: npx tsx scripts/test-integrations.ts
 */

import { getOpenRouterClient } from '../lib/integrations/openrouter';
import { getFirecrawlClient } from '../lib/integrations/firecrawl';
import { getGmailClient } from '../lib/integrations/gmail';
import { createClient } from '@supabase/supabase-js';

async function testOpenRouter() {
  console.log('\n🤖 Testing OpenRouter...');
  try {
    const client = getOpenRouterClient();
    const response = await client.claude([
      { role: 'user', content: 'Say "OpenRouter is working!" in exactly 3 words.' }
    ], { max_tokens: 50 });
    
    console.log('✅ OpenRouter working!');
    console.log('   Response:', response.trim());
    return true;
  } catch (error: any) {
    console.error('❌ OpenRouter failed:', error.message);
    return false;
  }
}

async function testFirecrawl() {
  console.log('\n🔥 Testing Firecrawl...');
  try {
    const client = getFirecrawlClient();
    const markdown = await client.scrapeMarkdown('https://example.com');
    
    console.log('✅ Firecrawl working!');
    console.log('   Scraped', markdown.length, 'characters');
    return true;
  } catch (error: any) {
    console.error('❌ Firecrawl failed:', error.message);
    return false;
  }
}

async function testGmail() {
  console.log('\n📧 Testing Gmail...');
  try {
    const client = getGmailClient();
    
    // Just test authentication, don't send email yet
    const messages = await client.getUnreadMessages(1);
    
    console.log('✅ Gmail working!');
    console.log('   Found', messages.length, 'unread messages');
    return true;
  } catch (error: any) {
    console.error('❌ Gmail failed:', error.message);
    console.log('   Make sure you have completed OAuth setup');
    return false;
  }
}

async function testSupabase() {
  console.log('\n🗄️  Testing Supabase...');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data, error } = await supabase
      .from('companies')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Supabase working!');
    return true;
  } catch (error: any) {
    console.error('❌ Supabase failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing All Integrations...');
  console.log('================================');
  
  const results = await Promise.all([
    testOpenRouter(),
    testFirecrawl(),
    testGmail(),
    testSupabase(),
  ]);
  
  console.log('\n================================');
  console.log('📊 Test Results:');
  console.log('================================');
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All integrations working! Ready to build agents.');
  } else {
    console.log('\n⚠️  Some integrations failed. Check error messages above.');
    console.log('   Make sure all API keys are in .env.local');
  }
  
  process.exit(passed === total ? 0 : 1);
}

main();
