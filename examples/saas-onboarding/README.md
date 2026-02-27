# SaaS Onboarding Example — TaskFlow

A SaaS trial setup intake that configures a pre-built workspace. Demonstrates complex intake schemas with arrays and integration-aware onboarding.

## What It Does

An AI agent submits team information (size, use case, current tools, integration needs, priority features) and receives a trial offer with a pre-configured workspace. The offer includes migration guides for current tools, recommended templates, and integration setup.

## Running

```bash
node server.js
# Server starts on http://localhost:3003
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/.well-known/agent-intake.json` | Discovery manifest |
| POST | `/api/aip/trial-setup` | Submit onboarding intake |
| POST | `/api/aip/bind` | Start the trial |

## Example Flow

### 1. Discover

```bash
curl http://localhost:3003/.well-known/agent-intake.json
```

### 2. Submit

```bash
curl -X POST http://localhost:3003/api/aip/trial-setup \
  -H "Content-Type: application/json" \
  -d '{
    "aip_version": "0.1.0",
    "agent": {
      "id": "test-agent-001",
      "platform": "anthropic",
      "consent_scope": ["intake", "offer"]
    },
    "intake_data": {
      "team_size": "6-20",
      "use_case": "software_dev",
      "current_tools": ["jira", "notion"],
      "integrations_needed": ["slack", "github"],
      "priority_features": ["kanban", "automations", "reporting"]
    },
    "session_id": "880e8400-e29b-41d4-a716-446655440003"
  }'
```

### 3. Bind

```bash
curl -X POST http://localhost:3003/api/aip/bind \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id": "OFFER_ID_FROM_RESPONSE",
    "session_id": "880e8400-e29b-41d4-a716-446655440003",
    "bind_data": {
      "email": "admin@company.com",
      "full_name": "Alex Johnson"
    },
    "agent": {
      "id": "test-agent-001",
      "consent_scope": ["intake", "offer", "bind", "account_creation"]
    }
  }'
```

## Plans

| Team Size | Plan | Price | Trial |
|-----------|------|-------|-------|
| Solo | Starter | Free | 14 days |
| 2-5 | Team | $12/user/mo | 14 days |
| 6-20 | Business | $20/user/mo | 30 days |
| 21-50 | Business Plus | $18/user/mo | 30 days |
| 51-200 | Enterprise | $15/user/mo | 30 days |
| 200+ | Enterprise | Custom | 30 days |
