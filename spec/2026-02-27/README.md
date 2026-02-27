# AIP Specification — v0.1.0 (2026-02-27)

This directory contains the JSON Schemas for the Agent Intake Protocol specification version 0.1.0.

## Schemas

| Schema | Description |
|--------|-------------|
| [agent-intake.schema.json](agent-intake.schema.json) | Manifest schema — the `/.well-known/agent-intake.json` file that businesses publish for agent discovery |
| [intake-request.schema.json](intake-request.schema.json) | Intake request schema — the payload an agent POSTs to an intake endpoint |
| [offer-response.schema.json](offer-response.schema.json) | Offer response schema — the soft-contract returned by the business |
| [bind-request.schema.json](bind-request.schema.json) | Bind request schema — the payload sent when a user accepts an offer |

## Protocol Lifecycle

```
DISCOVER → SUBMIT → OFFER → REVIEW → BIND | DECLINE
```

1. **Discover**: Agent fetches `/.well-known/agent-intake.json` (validated by `agent-intake.schema.json`)
2. **Submit**: Agent POSTs to intake endpoint (validated by `intake-request.schema.json`)
3. **Offer**: Business responds with soft-contract (validated by `offer-response.schema.json`)
4. **Review**: Agent presents offer to user (no schema — client-side)
5. **Bind**: Agent POSTs bind request (validated by `bind-request.schema.json`)

## Versioning

- **Semver**: `0.1.0`
- **Date snapshot**: `2026-02-27`
- Breaking changes will increment the minor version and create a new date directory.
- The latest spec is always at `spec/{latest-date}/`.

## JSON Schema Version

All schemas use [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/schema).

## Status

This is the initial release of the AIP specification. The protocol is in draft status and subject to change based on community feedback and implementation experience.
