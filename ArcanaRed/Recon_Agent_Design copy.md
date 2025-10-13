# Recon Agent Design

## 1. Overview
The Recon Agent performs on-demand or scheduled checks on test accounts to validate normal behavior:
- Logs in to an existing test account.
- Retrieves account balance.
- Executes a simple transaction.
- Detects anomalies (balance diff, new transactions, settings changes).

## 2. Components

### 2.1 Shared Core Library
- **Login Module**: Common Playwright scripts for authentication.
- **Navigator Module**: Helpers for page transitions and element selectors.

### 2.2 Recon Service
- **API Mode**: HTTP endpoint to trigger a run.
- **Scheduler Mode**: Cron-based in-app scheduler (1–10 min).

### 2.3 Data Storage
- **Postgres**: Schema (account_id, run_id, balance_before, balance_after, diff, anomalies, timestamp).
- **Migrations**: Supabase migrations.

### 2.4 Anomaly Detection & Reporting
- **Rules Engine**: JSON-configurable rules for alerts.
- **Notifications**: Slack webhook + email (SMTP/SES).
- **Metrics**: Prometheus exporter (latency, success, anomalies).

## 3. Data Flow
1. Trigger (API or cron).
2. Shared Core Library login & navigate to balance.
3. Fetch `balance_before`.
4. Execute test transaction.
5. Fetch `balance_after` & diff.
6. Compare against rules & log results.
7. Store in Postgres and send alerts if anomalies.

## 4. Dependencies
- Node.js >= 16
- Playwright >= 1.30
- Postgres (via Supabase)
- Slack webhook URL

## 5. Deployment
- Containerized (Docker).
- Kubernetes CronJob for scheduler.

## 6. Testing & Validation
- **Unit**: Mock Playwright contexts.
- **Integration**: Run against sandbox accounts.
- **Load**: Simulate multiple runs concurrently.
