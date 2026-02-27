# Calculator Example — BMI Calculator

A non-binding health calculator intake. Demonstrates a stateless computation flow with no binding step.

## What It Does

An AI agent submits height and weight data and receives a BMI calculation with category, risk level, and healthy weight range. No account creation or follow-up — the result is the complete interaction.

This example demonstrates `binding_available: false` — the protocol supports simple tool/calculator use cases that don't require a relationship.

## Running

```bash
node server.js
# Server starts on http://localhost:3002
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/.well-known/agent-intake.json` | Discovery manifest |
| POST | `/api/aip/bmi` | Calculate BMI |

## Example Flow

### 1. Discover

```bash
curl http://localhost:3002/.well-known/agent-intake.json
```

### 2. Submit

```bash
curl -X POST http://localhost:3002/api/aip/bmi \
  -H "Content-Type: application/json" \
  -d '{
    "aip_version": "0.1.0",
    "agent": {
      "id": "test-agent-001",
      "platform": "anthropic",
      "consent_scope": ["intake", "offer"]
    },
    "intake_data": {
      "height_inches": 70,
      "weight_lbs": 185,
      "age": 45,
      "sex": "male"
    },
    "session_id": "770e8400-e29b-41d4-a716-446655440002"
  }'
```

No bind step — the calculation result is the complete response.

## Response Details

The response includes:
- BMI value (rounded to 1 decimal)
- Category (Underweight / Normal / Overweight / Obese Class I-III)
- Risk level
- Healthy weight range for the given height
- Disclaimer about BMI limitations
