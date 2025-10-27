-- Sentinel Database Schema
-- Agentic Commerce Merchant Acceptance Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Merchants table
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT,
  api_key TEXT UNIQUE NOT NULL,
  api_secret TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('shopify', 'stripe', 'headless', 'synthetic')),
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  contact TEXT,
  public_key TEXT,
  trust_tier TEXT CHECK (trust_tier IN ('trusted', 'unknown', 'blocked')) DEFAULT 'unknown',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mandates table (consent records)
CREATE TABLE mandates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mandate_id TEXT UNIQUE NOT NULL,
  agent_id UUID REFERENCES agents(id),
  merchant_id UUID REFERENCES merchants(id),
  user_id TEXT,
  policy_url TEXT,
  consent_timestamp TIMESTAMPTZ NOT NULL,
  cart_hash TEXT,
  ap2_blob JSONB,
  acp_blob JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intents table (checkout sessions)
CREATE TABLE intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intent_id TEXT UNIQUE NOT NULL,
  agent_id UUID REFERENCES agents(id),
  merchant_id UUID REFERENCES merchants(id),
  mandate_id UUID REFERENCES mandates(id),
  items JSONB NOT NULL,
  totals JSONB NOT NULL,
  pay_url TEXT,
  adapter TEXT CHECK (adapter IN ('shopify', 'stripe', 'synthetic')),
  status TEXT CHECK (status IN ('pending', 'confirmed', 'expired', 'cancelled')) DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table (completed purchases)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT UNIQUE NOT NULL,
  intent_id UUID REFERENCES intents(id),
  psp_order_id TEXT,
  evidence_pack JSONB NOT NULL,
  policy_snapshot_url TEXT,
  status TEXT CHECK (status IN ('completed', 'refunded', 'disputed', 'cancelled')) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RMA Tokens table (returns)
CREATE TABLE rma_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rma_id TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id),
  sku TEXT NOT NULL,
  reason_code TEXT CHECK (reason_code IN ('NOT_AS_DESCRIBED', 'DAMAGED', 'SIZE_FIT', 'CHANGED_MIND', 'OTHER')),
  policy_snapshot JSONB NOT NULL,
  conditions JSONB,
  label_url TEXT,
  status TEXT CHECK (status IN ('issued', 'in_transit', 'received', 'refunded', 'rejected')) DEFAULT 'issued',
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies table (rules engine)
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id),
  rules JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  effective_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table (real-time activity)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id),
  merchant_id UUID REFERENCES merchants(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_agent_id ON sessions(agent_id);
CREATE INDEX idx_sessions_merchant_id ON sessions(merchant_id);

-- Products table (for synthetic merchants)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id),
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_value INTEGER NOT NULL,
  price_currency TEXT DEFAULT 'USD',
  inventory_available INTEGER DEFAULT 0,
  category TEXT,
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, sku)
);

-- Indexes for performance
CREATE INDEX idx_agents_agent_id ON agents(agent_id);
CREATE INDEX idx_agents_trust_tier ON agents(trust_tier);
CREATE INDEX idx_intents_status ON intents(status);
CREATE INDEX idx_intents_created_at ON intents(created_at DESC);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_rma_tokens_status ON rma_tokens(status);
CREATE INDEX idx_products_merchant_id ON products(merchant_id);

-- Row Level Security (RLS) policies
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rma_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS
CREATE POLICY "Service role can do anything" ON merchants FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do anything" ON agents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do anything" ON mandates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do anything" ON intents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do anything" ON orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do anything" ON rma_tokens FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do anything" ON policies FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do anything" ON sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do anything" ON products FOR ALL USING (auth.role() = 'service_role');

-- Functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_intents_updated_at BEFORE UPDATE ON intents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
