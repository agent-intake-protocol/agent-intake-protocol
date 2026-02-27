<p align="center">
  <img src="docs/assets/img/aip-logo.svg" alt="AIP Logo" width="120">
</p>

<h1 align="center">Agent Intake Protocol (AIP)</h1>

<p align="center">
  <strong>An open protocol for agent-mediated service intake, evaluation, and onboarding.</strong>
</p>

<p align="center">
  <a href="https://agent-intake-protocol.github.io/agent-intake-protocol/"><img src="https://img.shields.io/badge/docs-GitHub%20Pages-orange" alt="Documentation"></a>
  <a href="https://github.com/agent-intake-protocol/agent-intake-protocol/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://github.com/agent-intake-protocol/agent-intake-protocol/blob/main/spec/2026-02-27/"><img src="https://img.shields.io/badge/spec-v0.1.0-green" alt="Spec v0.1.0"></a>
  <a href="https://agentintake.io"><img src="https://img.shields.io/badge/registry-agentintake.io-f77f00" alt="Registry"></a>
</p>

---

## What is AIP?

AIP enables AI agents — acting on behalf of users — to discover and interact with business service endpoints. Agents can submit intake data, receive structured offers (soft-contracts), and optionally bind to initiate a service relationship.

Unlike protocols focused on tool integration (MCP), agent-to-agent communication (A2A), or product commerce (UCP/ACP), AIP addresses **agent-mediated service relationships** — the process of intake, evaluation, matching, and onboarding.

```
Layer Stack:
─────────────────────────────────
  Payment        │ AP2, ACP
─────────────────────────────────
  Commerce       │ UCP, ACP
─────────────────────────────────
  Intake/Offers  │ AIP  ◄── THIS
─────────────────────────────────
  Agent Comms    │ A2A
─────────────────────────────────
  Tool/Data      │ MCP
─────────────────────────────────
  Identity/Trust │ AGNTCY
─────────────────────────────────
```

## Quick Start

### 1. Publish a manifest

Serve a JSON file at `/.well-known/agent-intake.json`:

```json
{
  "aip_version": "0.1.0",
  "provider": {
    "name": "Your Business",
    "url": "https://yourbusiness.com",
    "description": "What you do"
  },
  "intakes": [
    {
      "id": "main-intake",
      "name": "Get a Quote",
      "description": "Submit your requirements for a personalized quote",
      "endpoint": "https://yourbusiness.com/api/aip/quote",
      "method": "POST",
      "category": "b2b/vendor",
      "input_schema": {
        "type": "object",
        "required": ["company_size"],
        "properties": {
          "company_size": { "type": "string", "enum": ["1-10", "11-50", "51-200", "200+"] },
          "use_case": { "type": "string" }
        }
      },
      "offer_type": "quote",
      "binding_available": true,
      "requires_auth": false,
      "privacy": {
        "data_retention": "none",
        "pii_required": false,
        "redacted_acceptable": true
      }
    }
  ]
}
```

### 2. Handle intake submissions

```js
// Your endpoint receives structured intake data
app.post('/api/aip/quote', (req, res) => {
  const { intake_data, session_id } = req.body;

  res.json({
    aip_version: '0.1.0',
    session_id,
    status: 'offer',
    offer: {
      id: crypto.randomUUID(),
      summary: 'Here is your personalized quote.',
      details: { plan: 'Professional', price: 99, currency: 'USD' },
      expires: new Date(Date.now() + 7 * 86400000).toISOString(),
      bind_endpoint: 'https://yourbusiness.com/api/aip/bind',
      bind_requires: ['email', 'full_name']
    }
  });
});
```

### 3. (Optional) Handle binding

When the user accepts an offer, the agent sends a bind request with the required PII.

## Protocol Lifecycle

```
DISCOVER → SUBMIT → OFFER → REVIEW → BIND | DECLINE
```

1. **Discover** — Agent finds `/.well-known/agent-intake.json`
2. **Submit** — Agent POSTs anonymized user context to the intake endpoint
3. **Offer** — Business returns a structured, non-binding soft-contract
4. **Review** — Agent presents the offer to the user for evaluation
5. **Bind / Decline** — User authorizes binding or lets the offer expire

## Key Principles

- **User Sovereignty** — The user always decides. Agents are delegates, not decision-makers.
- **Privacy by Default** — Intake uses anonymized data. PII only flows at bind time.
- **Non-Binding Offers** — Soft-contracts are offers, not commitments.
- **Simple Implementation** — One JSON file + one endpoint. No LLM required on the business side.
- **Open Standard** — MIT-licensed. Free to implement.

## Repository Structure

```
├── spec/2026-02-27/          # JSON Schemas (versioned)
├── examples/
│   ├── health-assessment/    # Metabolic health intake
│   ├── service-matching/     # Service marketplace
│   ├── calculator/           # Non-binding calculator
│   └── saas-onboarding/      # SaaS trial setup
├── sdk/js/                   # Lightweight JS helpers
└── docs/                     # GitHub Pages site
```

## Examples

| Example | Description | Binding? |
|---------|-------------|----------|
| [Health Assessment](examples/health-assessment/) | Metabolic health evaluation for men 40+ | Yes |
| [Service Matching](examples/service-matching/) | Service marketplace matching | Yes |
| [Calculator](examples/calculator/) | BMI calculator | No |
| [SaaS Onboarding](examples/saas-onboarding/) | SaaS trial setup | Yes |

## Links

- [Documentation & White Paper](https://agent-intake-protocol.github.io/agent-intake-protocol/)
- [Specification](https://agent-intake-protocol.github.io/agent-intake-protocol/specification.html)
- [AIP Registry](https://agentintake.io)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## License

MIT — see [LICENSE](LICENSE).
