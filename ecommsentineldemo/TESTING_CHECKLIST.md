# 🧪 Sentinel Testing Checklist

Use this checklist to verify everything works after setup.

---

## ✅ Pre-Flight Checks

Before testing, confirm:

- [ ] Supabase project created
- [ ] `supabase/schema.sql` executed successfully
- [ ] `.env.local` file exists with all 3 Supabase variables
- [ ] `npm install` completed without errors
- [ ] `npm run seed` completed successfully

---

## 🚀 Core Functionality Tests

### 1. Landing Page
**URL:** `http://localhost:3000`

- [ ] Page loads without errors
- [ ] Sentinel logo and branding visible
- [ ] Hero section displays correctly
- [ ] 3 feature cards show (Protocol, Evidence, Synthetic)
- [ ] "Open Console" button works
- [ ] "Synthetic Mode" status indicator shows green dot

**Expected:** Professional landing page with blue theme

---

### 2. Console Dashboard
**URL:** `http://localhost:3000/console`

- [ ] Dashboard loads
- [ ] Sidebar navigation visible
- [ ] 4 stat cards display:
  - [ ] Total Orders (should be 5 after seed)
  - [ ] Active Agents (should be 5 after seed)
  - [ ] Pending Returns (should be 2-3)
  - [ ] Total Sessions (should be 15+)
- [ ] Recent Activity feed shows events
- [ ] Activity items show agent names
- [ ] Timestamps are formatted correctly

**Expected:** Dashboard with populated stats and activity

---

### 3. Orders Page
**URL:** `http://localhost:3000/console/orders`

- [ ] Orders table loads
- [ ] At least 5 orders visible (from seed)
- [ ] Each row shows:
  - [ ] Order ID (monospace font)
  - [ ] Agent name
  - [ ] Merchant name
  - [ ] Total amount (formatted as currency)
  - [ ] Status badge (green for "completed")
  - [ ] Date (formatted)
  - [ ] "View" link
- [ ] Click any "View" link

**Expected:** Table of orders with proper formatting

---

### 4. Order Detail Page
**URL:** `http://localhost:3000/console/orders/[id]`

- [ ] Order detail page loads
- [ ] Back arrow works (returns to orders list)
- [ ] 3 summary cards show:
  - [ ] Agent info with trust tier
  - [ ] Merchant info with domain
  - [ ] Total amount with date
- [ ] Order items table displays:
  - [ ] SKU, Product name, Qty, Price, Total
  - [ ] Subtotal, Tax, Shipping rows
  - [ ] Grand total (bold)
- [ ] Evidence Pack section shows:
  - [ ] JSON formatted code block
  - [ ] mandate object
  - [ ] auth object
  - [ ] policy_snapshot object
  - [ ] psp_receipt object
  - [ ] agent_headers object
  - [ ] context object
- [ ] PSP Details section shows order info
- [ ] "Download Evidence Pack" button visible (UI only)

**Expected:** Complete order details with evidence pack

---

### 5. Agents Page
**URL:** `http://localhost:3000/console/agents`

- [ ] Agents page loads
- [ ] 3 stat cards show counts by tier:
  - [ ] Trusted (should be 2)
  - [ ] Unknown (should be 2)
  - [ ] Blocked (should be 1)
- [ ] Agents table displays all 5 agents
- [ ] Each row shows:
  - [ ] Agent ID (monospace)
  - [ ] Name
  - [ ] Contact email
  - [ ] Trust tier badge (colored with icon)
  - [ ] Created date
- [ ] Trust tier badges have correct colors:
  - [ ] Green for "Trusted"
  - [ ] Yellow for "Unknown"
  - [ ] Red for "Blocked"

**Expected:** Agents list with color-coded trust tiers

---

### 6. Returns Page
**URL:** `http://localhost:3000/console/returns`

- [ ] Returns page loads
- [ ] 4 stat cards show counts by status
- [ ] RMA tokens table displays (2-3 tokens from seed)
- [ ] Each row shows:
  - [ ] RMA ID (monospace)
  - [ ] Order ID (monospace)
  - [ ] SKU
  - [ ] Reason (human-readable)
  - [ ] Status badge
  - [ ] Issued date
  - [ ] Label link (or "N/A")
- [ ] Reason codes are formatted:
  - [ ] "Not as Described" (not "NOT_AS_DESCRIBED")
  - [ ] "Changed Mind" (not "CHANGED_MIND")

**Expected:** Returns table with RMA tokens

---

### 7. Policies Page
**URL:** `http://localhost:3000/console/policies`

- [ ] Policies page loads
- [ ] 3 policy cards display (one per merchant)
- [ ] Each card shows:
  - [ ] Merchant name
  - [ ] Version and effective date
  - [ ] Allowlist section (with agent IDs)
  - [ ] Blocklist section (with agent IDs)
  - [ ] Limits section with 3 cards:
    - [ ] Rate Limit (req/min)
    - [ ] Max Order Value ($)
    - [ ] Daily Spend Cap ($)
  - [ ] SPC/3DS threshold
  - [ ] Allowed countries
  - [ ] "View Raw Policy JSON" collapsible
- [ ] Click "View Raw Policy JSON" expands JSON

**Expected:** Policy cards with all rules visible

---

## 🤖 CLI Demo Agent Test

### Run Demo Agent
```bash
npm run demo-agent
```

**Verify output shows:**

- [ ] Step 1: Fetching Merchant ✓
- [ ] Step 2: Agent Verification ✓
  - [ ] Shows agent_id
  - [ ] Shows trust_tier
- [ ] Step 3: Browsing Products ✓
  - [ ] Lists 2-3 products with prices
- [ ] Step 4: Creating Checkout Intent ✓
  - [ ] Shows intent_id
  - [ ] Shows total amount
  - [ ] Shows pay_url
- [ ] Step 5: Processing Payment ✓
  - [ ] Shows "Simulating payment..." message
  - [ ] 1.5 second delay
- [ ] Step 6: Evidence Pack Generated ✓
  - [ ] Shows mandate info
  - [ ] Shows auth method
  - [ ] Shows PSP receipt
- [ ] Step 7: Initiating Return ✓
  - [ ] Shows RMA ID
  - [ ] Shows label URL
- [ ] Final success message displays
- [ ] "Next steps" instructions shown

**Expected:** Colorful terminal output with all 7 steps passing

---

### Verify Demo Agent Created Data

After running demo agent, refresh console and check:

- [ ] Dashboard stats increased:
  - [ ] Total Orders +1
  - [ ] Total Sessions +3 (verify, intent, confirm)
- [ ] New order appears in orders table
  - [ ] Agent name is "DemoBot"
  - [ ] Status is "completed"
- [ ] Click new order → evidence pack is complete
- [ ] "DemoBot" appears in agents list
  - [ ] Trust tier is "unknown"
- [ ] New RMA token in returns (if generated)

**Expected:** New data visible in console

---

## 🔌 API Endpoint Tests

### Test with cURL

**Get merchant API key first:**
1. Go to console dashboard
2. Check recent activity for merchant info
3. Or query Supabase directly

#### Test 1: Verify Agent
```bash
curl -X POST http://localhost:3000/api/agents/verify \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "TestBot",
    "agent_key": "test_123",
    "agent_contact": "test@example.com"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "agent_id": "agent_testbot_test_123",
    "agent_uuid": "...",
    "name": "TestBot",
    "trust_tier": "unknown",
    "verified_at": "2025-10-22T..."
  }
}
```

- [ ] Response has `success: true`
- [ ] Returns agent_id
- [ ] Returns trust_tier
- [ ] Agent appears in console

---

#### Test 2: Create Checkout Intent
```bash
# Replace with actual values from console
curl -X POST http://localhost:3000/api/checkout/intent \
  -H "Content-Type: application/json" \
  -d '{
    "agent_uuid": "YOUR_AGENT_UUID",
    "merchant_api_key": "YOUR_MERCHANT_API_KEY",
    "items": [
      {"sku": "YOUR_PRODUCT_SKU", "qty": 1}
    ]
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "intent_id": "intent_...",
    "pay_url": "https://checkout.synthetic...",
    "items": [...],
    "totals": {
      "subtotal": 12900,
      "tax": 1032,
      "shipping": 999,
      "total": 14931,
      "currency": "USD"
    }
  }
}
```

- [ ] Response has `success: true`
- [ ] Returns intent_id
- [ ] Returns pay_url
- [ ] Totals are calculated correctly

---

## 🗄️ Database Verification

### Check Supabase Dashboard

**Go to:** Supabase Dashboard → Table Editor

#### Merchants Table
- [ ] 3 merchants exist
- [ ] Each has name, domain, api_key
- [ ] Platform is "synthetic"

#### Products Table
- [ ] 30 products exist (10 per merchant)
- [ ] Each has sku, name, price_value
- [ ] Inventory > 0

#### Agents Table
- [ ] 5 agents exist
- [ ] Trust tiers: 2 trusted, 2 unknown, 1 blocked
- [ ] Each has agent_id, name, contact

#### Orders Table
- [ ] 5+ orders exist
- [ ] Each has order_id, psp_order_id
- [ ] evidence_pack is populated (JSONB)
- [ ] Status is "completed"

#### RMA Tokens Table
- [ ] 2-3 RMA tokens exist
- [ ] Each has rma_id, order_id, sku
- [ ] Status is "issued"
- [ ] label_url is populated

#### Sessions Table
- [ ] 15+ session events exist
- [ ] Event types: agent_verify, checkout_intent, checkout_confirm
- [ ] Each has agent_id, event_data

#### Policies Table
- [ ] 3 policies exist (one per merchant)
- [ ] Rules JSONB contains allowlist, limits, require_spc

---

## 🎨 UI/UX Checks

### Visual Design
- [ ] Professional blue color scheme
- [ ] Consistent spacing and typography
- [ ] Icons from Lucide React
- [ ] Hover states on interactive elements
- [ ] Responsive layout (try resizing window)

### Navigation
- [ ] Sidebar links work
- [ ] Active page highlighted
- [ ] Back buttons work
- [ ] External links open in new tab

### Data Display
- [ ] Currency formatted correctly ($XX.XX)
- [ ] Dates formatted (Oct 22, 2025, 5:00 PM)
- [ ] Monospace font for IDs
- [ ] Badges have appropriate colors
- [ ] Tables are readable

---

## 🐛 Error Handling Tests

### Test Invalid Requests

#### Invalid Agent Verification
```bash
curl -X POST http://localhost:3000/api/agents/verify \
  -H "Content-Type: application/json" \
  -d '{}'
```

- [ ] Returns 400 error
- [ ] Error message mentions validation

#### Invalid Checkout Intent
```bash
curl -X POST http://localhost:3000/api/checkout/intent \
  -H "Content-Type: application/json" \
  -d '{
    "agent_uuid": "invalid-uuid",
    "merchant_api_key": "invalid",
    "items": []
  }'
```

- [ ] Returns 400 or 404 error
- [ ] Error message is helpful

---

## 📊 Performance Checks

### Page Load Times
- [ ] Landing page < 1s
- [ ] Console dashboard < 2s
- [ ] Orders page < 2s
- [ ] Order detail < 1s

### API Response Times
- [ ] Agent verify < 500ms
- [ ] Checkout intent < 1s
- [ ] Checkout confirm < 1s

---

## ✅ Final Checklist

Before considering setup complete:

- [ ] All pages load without errors
- [ ] All stats show correct numbers
- [ ] Demo agent runs successfully
- [ ] New data appears in console
- [ ] API endpoints respond correctly
- [ ] Database has all expected data
- [ ] UI looks professional
- [ ] No console errors in browser
- [ ] No TypeScript errors in terminal

---

## 🎉 Success Criteria

**You're ready to demo when:**

1. ✅ Seed script completed without errors
2. ✅ Demo agent shows all 7 steps passing
3. ✅ Console shows populated data
4. ✅ Evidence packs are complete
5. ✅ All pages load correctly
6. ✅ API endpoints work
7. ✅ UI looks professional

---

## 📝 Notes

**If any test fails:**
1. Check console logs (browser + terminal)
2. Verify `.env.local` has correct values
3. Confirm database was seeded
4. Try restarting dev server
5. Check SETUP.md troubleshooting section

**Common Issues:**
- Missing data → Run `npm run seed`
- API errors → Check Supabase credentials
- UI not loading → Clear cache, restart server
- TypeScript errors → Run `npm install` again

---

**All tests passing? You're ready to show this off! 🚀**
