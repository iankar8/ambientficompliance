/**
 * Supabase Client for Code & Capital
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local file
config({ path: '.env.local' });

// Check multiple environment variable names
const supabaseUrl = 
  process.env.SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  '';

const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_KEY ||
  '';

if (!supabaseUrl) {
  throw new Error('❌ Supabase URL not found. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in .env.local');
}

if (!supabaseKey) {
  throw new Error('❌ Supabase service key not found. Set SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
