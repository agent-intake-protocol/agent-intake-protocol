# Changelog

All notable changes to the Agent Intake Protocol will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-27

### Added
- Initial protocol specification (v0.1.0)
- JSON Schemas: agent-intake manifest, intake-request, offer-response, bind-request
- Discovery via `/.well-known/agent-intake.json`
- Five-stage lifecycle: Discover → Submit → Offer → Review → Bind/Decline
- Soft-contract (non-binding offer) primitive
- Privacy-by-default design (no PII until bind)
- Four example implementations:
  - Health Assessment (metabolic health for men 40+)
  - Service Matching (service marketplace)
  - Calculator (BMI, non-binding)
  - SaaS Onboarding (trial setup)
- JavaScript SDK (agent-side client + business-side server helpers)
- Documentation site with white paper, specification, examples, and FAQ
- MIT license

[0.1.0]: https://github.com/agent-intake-protocol/agent-intake-protocol/releases/tag/v0.1.0
