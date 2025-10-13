# AI Agent Swarm Fraud Demo

**1 ▪ Objective**

- Showcase in a sandbox how parallel AI agents can impersonate a bank rep and complete an account takeover (ATO) in **< 90 s**.

**2 ▪ Audience**

- Fraud-ops leaders, CISOs, risk executives assessing AI-driven threats.

**3 ▪ Problem**

- Traditional fraud tests use humans or linear scripts and miss critical timing gaps; modern AI swarms exploit sub-minute windows.

**4 ▪ AI Swarm Advantages**

- **Parallelism:** Call handling & ATO run concurrently.
- **Realism:** Specialized agents mirror fraud-ring roles.
- **Adaptivity:** Live sentiment-driven script moves.
- **Scalability:** A/B test dozens of variants overnight.
- **Reproducibility:** Nanosecond-precise logs for replay and analysis.

**5 ▪ Proposed Solution**

- **Social Cluster (Call + OTP):** Verifies PII (username, DOB, SSN4) and captures OTP via [Vapi.ai](http://vapi.ai/) voice agent.
- **Exploitation Cluster:** Uses headless Chromium (Playwright) in a VM to log in, change password, send $500 via Zelle, and clean logs.
- **Orchestration:** Redis blackboard + lightweight supervisor enforcing timeouts and safety rails.

**6 ▪ Demo Flow**

1. SMS lure → victim calls spoofed number.
2. Call-Handler agent collects username → DOB → SSN4 → requests OTP.
3. **Parallel fork:**
   - **Social:** maintains rapport.
   - **Exploitation:** logs in, transfers $500, modifies account details.
4. Agent closes call: “Your account is now secure.”

**7 ▪ Success Metrics**

- **End-to-End ATO:** < 90 s.
- **PII Collected:** username, DOB, SSN4.
- **Transfers:** $500 executed, zero sandbox flags.
- **Sentiment:** ≥ 0.7 trust score.

**8 ▪ Follow-Up Test: On-Hold Drain**

- Agent places victim on hold.
- Exploitation cluster executes **3× $500** transfers.
- Measure completed transfers vs hold time and victim hang-up rate.
