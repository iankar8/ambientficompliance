# Agent-Acceptance: Policy Onboarding Packet (v0.1)

**Purpose:** Collect merchant policies to auto-generate /agent.json feeds, Evidence Packs, and RMA tokens.

**Instructions:** Fill all fields below. Each section requires version, effective date, approver, and public URL.

---

## Cover Sheet

**Date:** YYYY-MM-DD  
**Merchant Name:** __________________________  
**Primary Contact (name & email):** __________________________  
**Public Policy Base URL (if any):** https://__________________________  
**Store Currency (e.g., USD):** USD | EUR | GBP | CAD | AUD  
**Platform(s):** [ ] Shopify [ ] Stripe [ ] Headless [ ] Other: __________

---

## 1. Returns & Exchanges Policy

### Metadata
- **Version:** __________
- **Effective Date:** YYYY-MM-DD
- **Approver (name/email):** __________________________
- **Public URL (if exists):** https://__________________________

### Key Parameters

**Return Window (days):** __________

**Restock Fee:**
- Percentage: _____% OR Flat amount: $_____

**Non-Returnable Categories** (comma-separated):
```
_________________________________________________________________
```

**Condition Requirements** (e.g., unworn, factory-sealed, tags attached):
```
_________________________________________________________________
_________________________________________________________________
```

**Proof Required** (photos, receipt, original packaging, etc.):
```
_________________________________________________________________
```

**In-Store Returns Allowed:** [ ] Yes [ ] No

**Original Tender vs Store Credit Rules:**
- Original tender refund if: ___________________________________________
- Store credit issued if: ___________________________________________
- Exceptions: ___________________________________________

**Additional Exceptions / Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

---

## 2. Terms of Sale / Purchase Conditions

### Metadata
- **Version:** __________
- **Effective Date:** YYYY-MM-DD
- **Approver (name/email):** __________________________
- **Public URL:** https://__________________________

### Key Clauses

**Cancellation Window (hours after purchase):** __________

**Price Adjustment Rules:**
- Adjustment window: ___________________________________________
- Eligible promotions: ___________________________________________
- Exclusions: ___________________________________________

**Digital/Tickets Clause** (if applicable):
- Refundability: ___________________________________________
- Resale restrictions: ___________________________________________
- Identity checks required: [ ] Yes [ ] No

**Arbitration / Jurisdiction:** __________________________

**Errors & Omissions Clause:**
```
_________________________________________________________________
```

---

## 3. Shipping & Delivery Policy

### Metadata
- **Version:** __________
- **Effective Date:** YYYY-MM-DD
- **Approver (name/email):** __________________________
- **Public URL:** https://__________________________

### Shipping Methods
(One per line: method_id | ETA_days | signature_required | notes)

```
ground          | 5-7  | no       | default method
expedited       | 2-3  | optional | cutoff 1pm local
overnight       | 1    | yes      | cutoff 10am local
_______________ | ____ | ________ | _____________________
```

**Order Cut-off Time (local timezone, e.g., 13:00 PST):** __________

**Lost/Damaged Package Handling:**
- Time window to file claim: ___________________________________________
- Photos required: [ ] Yes [ ] No
- Carrier claim process: ___________________________________________

**International Shipping:**
- Countries served: ___________________________________________
- Duties/VAT handling (DDP/DDU): ___________________________________________

---

## 4. Payment & Chargeback / Dispute Policy

### Metadata
- **Version:** __________
- **Effective Date:** YYYY-MM-DD
- **Approver (name/email):** __________________________
- **Public URL:** https://__________________________

### Payments & Authorization

**Accepted Payment Methods** (e.g., Visa/MC/AmEx/PayPal/Apple Pay):
```
_________________________________________________________________
```

**3DS / SPC (Secure Payment Confirmation) Usage:**
- Always required: [ ] Yes [ ] No
- Required when amount > $______
- Required for risk conditions: ___________________________________________
- Exemptions: ___________________________________________

### Disputes & Pre-Dispute Programs

**Pre-Dispute Programs Enrolled** (check all that apply):
- [ ] Visa RDR (Rapid Dispute Resolution)
- [ ] Visa Verifi Order Insight
- [ ] Mastercard Ethoca Consumer Clarity
- [ ] None
- [ ] Other: __________

**Representment Evidence Checklist** (what you provide for disputes):
- [ ] Proof of delivery (tracking/signature)
- [ ] Policy snapshot (returns/terms)
- [ ] 3DS/SPC authentication evidence
- [ ] Customer communications / screenshots
- [ ] Device / IP / AVS/CVV results (if available)
- [ ] Other: __________

**Contact / SLA for Issuer Inquiries:**
- Email: __________________________
- Response SLA: __________ hours

---

## 5. Warranty / Guarantee Policy

### Metadata
- **Version:** __________
- **Effective Date:** YYYY-MM-DD
- **Approver (name/email):** __________________________
- **Public URL:** https://__________________________

### Parameters

**Warranty Period (days):** __________

**Coverage Summary:**
```
_________________________________________________________________
_________________________________________________________________
```

**Exclusions:**
```
_________________________________________________________________
_________________________________________________________________
```

**Route Certain Claims to OEM:** [ ] Yes [ ] No
- If yes, list SKU patterns or categories: ___________________________________________

---

## 6. Privacy Policy (Payments/Data Section)

### Metadata
- **Version:** __________
- **Effective Date:** YYYY-MM-DD
- **Approver (name/email):** __________________________
- **Public URL:** https://__________________________

### Data Handling

**PII Handling Summary:**
- What we collect at checkout: ___________________________________________
- How we process/store: ___________________________________________
- Data subject rights (links/emails): ___________________________________________

**Data Retention (days):** __________ (default: 30 for Evidence Pack; configurable)

**Regional Constraints** (GDPR/CPRA, data residency requirements):
```
_________________________________________________________________
```

**DSR (Data Subject Request) Contact:**
- Email or URL: __________________________

---

## 7. Tax & Duties Policy

### Metadata
- **Version:** __________
- **Effective Date:** YYYY-MM-DD
- **Approver (name/email):** __________________________
- **Public URL:** https://__________________________

### Parameters

**Tax Nexus** (states/countries where you collect tax):
```
_________________________________________________________________
```

**Duties/VAT Policy:**
- [ ] DDP (Delivered Duty Paid - we handle all duties)
- [ ] DDU (Delivered Duty Unpaid - customer pays duties)
- [ ] Hybrid (varies by country): ___________________________________________

**Tax-Exempt Process** (if applicable):
```
_________________________________________________________________
```

---

## 8. Returns SOP / RMA Workflow (Operations Playbook)

### Metadata
- **Version:** __________
- **Effective Date:** YYYY-MM-DD
- **Approver (name/email):** __________________________
- **Public URL (internal OK):** https://__________________________

### Workflow Details

**RMA Required for All Returns:** [ ] Yes [ ] No

**Time-to-Refund (business days after receipt):** __________

**Inspection Checklist** (what you verify on returned items):
- [ ] Verify item condition (unworn/sealed/undamaged)
- [ ] Verify serial/IMEI (if serialized electronics)
- [ ] Photos taken (front/label/serial)
- [ ] Accessories/packaging present
- [ ] Other: __________

**Grading Scheme** (A/B/C or pass/fail):
```
_________________________________________________________________
```

**Photos Required on Return:** [ ] Yes [ ] No
- If yes, specify: (front, label, serial, damage, etc.) ___________________________________________

**Serialized Items (IMEI/SN Capture):** [ ] Yes [ ] No
- If yes, list categories: ___________________________________________

**Restocking Process:**
- Immediate resale if: ___________________________________________
- Open-box/discount if: ___________________________________________
- Disposal if: ___________________________________________

---

## 9. Fraud & Abuse Policy (Optional - Day 3)

### Metadata
- **Version:** __________
- **Effective Date:** YYYY-MM-DD
- **Approver (name/email):** __________________________

### Parameters

**High-Risk SKUs** (require extra verification):
```
_________________________________________________________________
```

**Stepped-Up Auth Thresholds:**
- Require 3DS/SPC when amount > $______
- Require for first-time buyers: [ ] Yes [ ] No
- Require for high-velocity orders: [ ] Yes [ ] No

**Repeat Abuser Handling:**
```
_________________________________________________________________
```

**Photo-on-Return Requirement for Specific Categories:**
```
_________________________________________________________________
```

---

## 10. Promotions & Price-Adjustment Policy (Optional - Day 3)

### Metadata
- **Version:** __________
- **Effective Date:** YYYY-MM-DD
- **Approver (name/email):** __________________________

### Parameters

**Promotion Stackability:**
- Can stack: [ ] Yes [ ] No
- Exclusions: ___________________________________________

**Post-Purchase Price Adjustments:**
- Adjustment window: __________ days
- Limits: ___________________________________________
- Blackout dates: ___________________________________________

---

## Sign-Off

By submitting this packet, you confirm the above policies are accurate, in effect, and approved for the agent checkout channel.

**Signatory Name:** __________________________  
**Title:** __________________________  
**Date:** YYYY-MM-DD  
**Email:** __________________________  
**Signature:** __________________________

---

## Machine-Readable Schema (Auto-Extraction Fields)

The system will extract the following structured fields from your PDFs:

### Returns
- `returns_window_days`
- `returns_restock_fee`
- `returns_non_returnables[]`
- `returns_condition_requirements[]`
- `returns_proof_required[]`
- `returns_in_store_allowed`
- `returns_store_credit_rules`
- `returns_exceptions[]`

### Terms
- `terms_cancellation_window_hours`
- `terms_price_adjustment`
- `terms_digital_tickets_clause`
- `terms_arbitration_jurisdiction`

### Shipping
- `shipping_methods[]` (id, eta_days, signature_required, notes)
- `shipping_cutoff`
- `shipping_lost_damaged`

### Payments
- `payments_accepted_tenders[]`
- `payments_3ds_spc_usage`
- `payments_pre_dispute_programs[]`
- `payments_evidence_checklist[]`
- `payments_contact_sla`

### Warranty
- `warranty_period_days`
- `warranty_coverage`
- `warranty_exclusions[]`
- `warranty_oem_routing`

### Privacy
- `privacy_pii_handling`
- `privacy_retention_days`
- `privacy_regional_constraints`
- `privacy_dsr_contact`

### Tax
- `tax_nexus[]`
- `tax_duty_policy` (DDP/DDU)
- `tax_exempt_process`

### RMA
- `rma_required`
- `rma_time_to_refund_days`
- `rma_inspection_checklist[]`
- `rma_grading_scheme`
- `rma_photos_required`
- `rma_serialization_required`

### Meta
- `merchant_name`
- `primary_contact`
- `policy_base_url`
- `store_currency`

---

**Document Version:** 0.1  
**Last Updated:** October 22, 2025  
**For questions:** support@yourcompany.com
