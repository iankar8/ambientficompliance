import { faker } from '@faker-js/faker';
import { nanoid } from 'nanoid';

/**
 * Synthetic Data Generators
 * Creates realistic test data without needing real PSP accounts
 */

export interface SyntheticMerchant {
  id: string;
  name: string;
  domain: string;
  api_key: string;
  api_secret: string;
  platform: 'synthetic';
  config: {
    currency: string;
    returns_window_days: number;
    restock_fee: number;
  };
}

export interface SyntheticProduct {
  sku: string;
  name: string;
  description: string;
  price_value: number;
  price_currency: string;
  inventory_available: number;
  category: string;
  attributes: Record<string, any>;
}

export interface SyntheticAgent {
  agent_id: string;
  name: string;
  contact: string;
  public_key: string;
  trust_tier: 'trusted' | 'unknown' | 'blocked';
  metadata: {
    version: string;
    capabilities: string[];
  };
}

export function generateMerchant(): SyntheticMerchant {
  const companyName = faker.company.name();
  return {
    id: faker.string.uuid(),
    name: companyName,
    domain: faker.internet.domainName(),
    api_key: `sk_test_${nanoid(32)}`,
    api_secret: nanoid(48),
    platform: 'synthetic',
    config: {
      currency: 'USD',
      returns_window_days: faker.number.int({ min: 14, max: 90 }),
      restock_fee: faker.number.int({ min: 0, max: 20 }),
    },
  };
}

export function generateProduct(merchantId: string): SyntheticProduct {
  const categories = [
    'Electronics',
    'Apparel',
    'Home & Garden',
    'Sports & Outdoors',
    'Health & Beauty',
    'Toys & Games',
  ];
  
  const category = faker.helpers.arrayElement(categories);
  const productName = faker.commerce.productName();
  
  return {
    sku: `SKU-${nanoid(10)}`,
    name: productName,
    description: faker.commerce.productDescription(),
    price_value: faker.number.int({ min: 999, max: 49999 }), // cents
    price_currency: 'USD',
    inventory_available: faker.number.int({ min: 0, max: 500 }),
    category,
    attributes: {
      brand: faker.company.name(),
      color: faker.color.human(),
      weight: `${faker.number.float({ min: 0.1, max: 50, fractionDigits: 2 })} lbs`,
      dimensions: `${faker.number.int({ min: 5, max: 50 })}x${faker.number.int({ min: 5, max: 50 })}x${faker.number.int({ min: 5, max: 50 })} inches`,
    },
  };
}

export function generateAgent(trustTier: 'trusted' | 'unknown' | 'blocked' = 'unknown'): SyntheticAgent {
  const agentNames = [
    'ShopBuddy',
    'CartAssist',
    'BuyBot',
    'SmartShopper',
    'DealFinder',
    'PurchasePal',
    'OrderAgent',
    'CheckoutHelper',
  ];
  
  return {
    agent_id: `agent_${nanoid(16)}`,
    name: faker.helpers.arrayElement(agentNames),
    contact: faker.internet.email(),
    public_key: `pk_${nanoid(32)}`,
    trust_tier: trustTier,
    metadata: {
      version: faker.system.semver(),
      capabilities: ['checkout', 'returns', 'tracking'],
    },
  };
}

export function generateMandate(agentId: string, merchantId: string) {
  return {
    mandate_id: `mandate_${nanoid(16)}`,
    agent_id: agentId,
    merchant_id: merchantId,
    user_id: `user_${nanoid(12)}`,
    policy_url: `https://example.com/policies/terms`,
    consent_timestamp: new Date().toISOString(),
    cart_hash: nanoid(32),
    ap2_blob: null,
    acp_blob: null,
  };
}

export function generateIntent(
  agentId: string,
  merchantId: string,
  products: SyntheticProduct[]
) {
  const selectedProducts = faker.helpers.arrayElements(products, { min: 1, max: 3 });
  const items = selectedProducts.map((product) => ({
    sku: product.sku,
    name: product.name,
    qty: faker.number.int({ min: 1, max: 3 }),
    price: {
      value: product.price_value,
      currency: product.price_currency,
    },
  }));
  
  const subtotal = items.reduce((sum, item) => sum + item.price.value * item.qty, 0);
  const tax = Math.round(subtotal * 0.08); // 8% tax
  const shipping = 999; // $9.99
  const total = subtotal + tax + shipping;
  
  return {
    intent_id: `intent_${nanoid(16)}`,
    agent_id: agentId,
    merchant_id: merchantId,
    items,
    totals: {
      subtotal,
      tax,
      shipping,
      total,
      currency: 'USD',
    },
    pay_url: `https://checkout.synthetic.test/pay/${nanoid(16)}`,
    adapter: 'synthetic' as const,
    status: 'pending' as const,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
  };
}

export function generateEvidencePack(intent: ReturnType<typeof generateIntent>) {
  return {
    mandate: {
      policy_url: 'https://example.com/policies/terms',
      consent_timestamp: new Date().toISOString(),
    },
    auth: {
      method: '3DS',
      result: 'authenticated',
      transaction_id: `txn_${nanoid(16)}`,
    },
    policy_snapshot: {
      returns_window_days: 30,
      restock_fee: 0,
      conditions: ['unworn', 'tags_attached'],
    },
    psp_receipt: {
      charge_id: `ch_${nanoid(16)}`,
      session_id: `sess_${nanoid(16)}`,
      risk_score: faker.number.int({ min: 0, max: 100 }),
      avs_result: 'Y',
      cvv_result: 'M',
    },
    agent_headers: {
      'X-Agent-Name': 'ShopBuddy',
      'X-Agent-Key': `ak_${nanoid(16)}`,
      'X-Agent-Signature': `sig_${nanoid(32)}`,
    },
    context: {
      ip_address: faker.internet.ipv4(),
      user_agent: faker.internet.userAgent(),
      timestamp: new Date().toISOString(),
    },
  };
}

export function generateOrder(intentId: string, evidencePack: ReturnType<typeof generateEvidencePack>) {
  return {
    order_id: `order_${nanoid(16)}`,
    intent_id: intentId,
    psp_order_id: `psp_${nanoid(16)}`,
    evidence_pack: evidencePack,
    policy_snapshot_url: `https://storage.synthetic.test/policies/${nanoid(16)}.json`,
    status: 'completed' as const,
  };
}

export function generateRMAToken(orderId: string, sku: string) {
  const reasonCodes = ['NOT_AS_DESCRIBED', 'DAMAGED', 'SIZE_FIT', 'CHANGED_MIND', 'OTHER'] as const;
  
  return {
    rma_id: `rma_${nanoid(16)}`,
    order_id: orderId,
    sku,
    reason_code: faker.helpers.arrayElement(reasonCodes),
    policy_snapshot: {
      window_days: 30,
      conditions: ['unworn', 'tags_attached'],
      restock_fee: 0,
    },
    conditions: {
      photos_required: true,
      original_packaging: true,
    },
    label_url: `https://labels.synthetic.test/${nanoid(16)}.pdf`,
    status: 'issued' as const,
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  };
}

export function generateSession(agentId: string, merchantId: string, eventType: string) {
  return {
    agent_id: agentId,
    merchant_id: merchantId,
    event_type: eventType,
    event_data: {
      timestamp: new Date().toISOString(),
      details: {},
    },
    ip_address: faker.internet.ipv4(),
    user_agent: faker.internet.userAgent(),
  };
}
