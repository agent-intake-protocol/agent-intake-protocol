# Health Assessment Example — Man vs Health

A metabolic health assessment intake for men 40+. Demonstrates a personalized recommendation flow with binding.

## What It Does

An AI agent submits anonymized health data (age range, concerns, glucose range, activity level) and receives a personalized coaching plan recommendation with pricing. If the user accepts, they can bind by providing their email and name.

## Running

```bash
node server.js
# Server starts on http://localhost:3000
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/.well-known/agent-intake.json` | Discovery manifest |
| POST | `/api/aip/metabolic-assessment` | Submit intake |
| POST | `/api/aip/bind` | Accept an offer |

## Example Flow

### 1. Discover

```bash
curl http://localhost:3000/.well-known/agent-intake.json
```

### 2. Submit

```bash
curl -X POST http://localhost:3000/api/aip/metabolic-assessment \
  -H "Content-Type: application/json" \
  -d '{
    "aip_version": "0.1.0",
    "agent": {
      "id": "test-agent-001",
      "platform": "anthropic",
      "consent_scope": ["intake", "offer"]
    },
    "intake_data": {
      "age_range": "40-49",
      "sex": "male",
      "primary_concern": "insulin_resistance",
      "fasting_glucose_range": "elevated",
      "activity_level": "moderate"
    },
    "session_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### 3. Bind (using the offer_id from the response)

```bash
curl -X POST http://localhost:3000/api/aip/bind \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id": "OFFER_ID_FROM_RESPONSE",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "bind_data": {
      "email": "user@example.com",
      "full_name": "John Doe"
    },
    "agent": {
      "id": "test-agent-001",
      "consent_scope": ["intake", "offer", "bind"]
    }
  }'
```

## Plans Offered

| Concern | Plan | Price |
|---------|------|-------|
| Insulin resistance (high risk) | Intensive Metabolic Reset | $249/mo |
| Insulin resistance (moderate) | Foundation Coaching | $149/mo |
| Weight | Weight Optimization Program | $149/mo |
| Energy | Energy & Vitality Protocol | $129/mo |
| General | Comprehensive Health Assessment | $99/mo |

Seniors (60+) receive a 15% discount.
