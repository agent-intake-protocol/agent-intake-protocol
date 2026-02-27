# Service Matching Example — WhoDo

A service marketplace intake that matches users with local service providers. Demonstrates multi-result offers with provider selection.

## What It Does

An AI agent submits a service request (type, zip code, urgency, budget) and receives a list of matched, vetted providers ranked by relevance. The user can review providers and bind to connect with their preferred match.

## Running

```bash
node server.js
# Server starts on http://localhost:3001
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/.well-known/agent-intake.json` | Discovery manifest |
| POST | `/api/aip/service-request` | Submit service request |
| POST | `/api/aip/bind` | Connect with a provider |

## Example Flow

### 1. Discover

```bash
curl http://localhost:3001/.well-known/agent-intake.json
```

### 2. Submit

```bash
curl -X POST http://localhost:3001/api/aip/service-request \
  -H "Content-Type: application/json" \
  -d '{
    "aip_version": "0.1.0",
    "agent": {
      "id": "test-agent-001",
      "platform": "anthropic",
      "consent_scope": ["intake", "offer"]
    },
    "intake_data": {
      "service_type": "plumbing",
      "zip_code": "90210",
      "urgency": "this_week",
      "budget_range": "100_500",
      "description": "Kitchen faucet leaking",
      "property_type": "house"
    },
    "session_id": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

### 3. Bind

```bash
curl -X POST http://localhost:3001/api/aip/bind \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id": "OFFER_ID_FROM_RESPONSE",
    "session_id": "660e8400-e29b-41d4-a716-446655440001",
    "bind_data": {
      "email": "user@example.com",
      "full_name": "Jane Smith",
      "phone": "555-0123"
    },
    "agent": {
      "id": "test-agent-001",
      "consent_scope": ["intake", "offer", "bind"]
    }
  }'
```

## Supported Service Types

plumbing, electrical, cleaning, landscaping, painting, hvac, roofing, handyman, moving, pest_control
