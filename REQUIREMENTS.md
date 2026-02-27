# AIP — Agent Intake Protocol
## Comprehensive Requirements Document

**Authors:** Paul (Man vs Health / OpenClaw) & Claude (Anthropic)
**Date:** February 27, 2026
**Version:** 0.1.0-draft
**Status:** Requirements Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Competitive Landscape](#3-competitive-landscape)
4. [Protocol Design](#4-protocol-design)
5. [Project Structure — Two Deliverables](#5-project-structure)
6. [Deliverable 1: Open Protocol (Public GitHub + GitHub Pages)](#6-deliverable-1)
7. [Deliverable 2: AIP Registry & Certification Service (Private, AWS)](#7-deliverable-2)
8. [Architecture](#8-architecture)
9. [Implementation Details](#9-implementation-details)
10. [Domain & Branding](#10-domain-branding)
11. [Testing Strategy](#11-testing-strategy)
12. [Project Management](#12-project-management)
13. [Future Backlog](#13-future-backlog)

---

## 1. Executive Summary

The **Agent Intake Protocol (AIP)** is an open, lightweight protocol that enables AI agents — acting on behalf of users — to discover and interact with business service endpoints for the purpose of intake, evaluation, matching, onboarding, and personalized offer generation. Unlike existing protocols (MCP, A2A, UCP, ACP) which focus on tool integration, agent-to-agent communication, or product commerce, AIP addresses the unserved gap of **agent-mediated service relationships**.

AIP introduces the concept of a **soft-contract**: a non-binding, structured response from a business to an agent's intake submission. The agent carries this offer back to the user, who can evaluate, compare across vendors, and choose to **bind** — converting the soft-contract into an active relationship, bypassing traditional intake ceremonies (forms, phone calls, onboarding wizards).

The protocol is published as an open standard. The business model is a **certification registry** — a service that crawls, validates, and certifies AIP-compliant endpoints, providing trust signals to agents and a directory for discovery.

---

## 2. Problem Statement

### The Gap in Today's Agent Ecosystem

AI agents today can browse the web, but they interact with businesses the same way humans do — filling out forms, navigating UIs, scraping content. When agents attempt deeper automated engagement (browser automation, form submission), they are treated as bots, blocked, or flagged as malicious.

There is no standardized way for an agent to say: *"I represent a human user. Here is their relevant (redacted) context. What can you offer them?"*

### What Exists and What Doesn't

| Protocol | Owner | Purpose | Covers Intake? |
|----------|-------|---------|---------------|
| **MCP** | Anthropic / LF | Connect agents to tools & data | No — tool integration only |
| **A2A** | Google / LF | Agent-to-agent communication | No — agent peers, not agent-to-business-for-user |
| **UCP** | Google + Shopify et al | Agentic product commerce | No — product purchase only |
| **ACP** | OpenAI + Stripe | Agentic checkout | No — transaction checkout only |
| **AP2** | Google | Agent payment processing | No — payment layer only |
| **AIP** | **This project** | **Agent-mediated service intake** | **YES** |

### The Core Insight

Every business has an intake process. Today that process is designed for humans — forms, calls, meetings. AIP standardizes that intake for agents, making it:

- **Discoverable** — via `/.well-known/agent-intake.json`
- **Structured** — defined input schemas, predictable responses
- **Non-binding** — soft-contracts are offers, not commitments
- **User-sovereign** — the user always decides; the agent is a delegate
- **Cheap to implement** — a single JSON endpoint, no LLM required on the business side

---

## 3. Competitive Landscape

### Positioning Statement

AIP is a **complement** to MCP, A2A, UCP, and ACP — not a competitor. It fills the "service relationship" layer that none of these protocols address.

### Landscape Analysis (for White Paper)

**MCP (Model Context Protocol)** — Anthropic, Nov 2024, now under Linux Foundation's AAIF. Connects AI models to external data/tools via standardized server interface. MCP is infrastructure — it tells an agent HOW to connect to a system. AIP tells the agent WHAT to submit to initiate a relationship.

**A2A (Agent2Agent)** — Google, Apr 2025, now under Linux Foundation. Enables agent-to-agent communication via Agent Cards at `/.well-known/agent-card.json`. A2A is peer-to-peer between autonomous agents. AIP is specifically agent-on-behalf-of-human to business-endpoint. The interaction is asymmetric by design.

**UCP (Universal Commerce Protocol)** — Google + Shopify + 20 partners, Jan 2026. Standardizes product commerce journey — discovery, checkout, payment. Businesses publish at `/.well-known/ucp`. UCP is product-centric. AIP is service/relationship-centric.

**ACP (Agentic Commerce Protocol)** — OpenAI + Stripe, Sep 2025. Enables AI agents to complete purchases. First implemented in ChatGPT Instant Checkout. ACP is transaction-centric. AIP is intake-centric — no money changes hands at the OFFER stage.

**AGNTCY** — Cisco-led, Linux Foundation, Jul 2025. Infrastructure for multi-agent collaboration — discovery, identity, messaging, observability. Network plumbing layer. AIP could eventually leverage AGNTCY for identity verification.

### Strategic Positioning in the White Paper

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

AIP sits between tool-level integration (MCP) and transaction-level commerce (UCP/ACP). It is the **relationship initiation layer**.

---

## 4. Protocol Design

### 4.1 Discovery

Businesses publish an AIP manifest at:
```
https://{domain}/.well-known/agent-intake.json
```

This follows the pattern established by:
- A2A: `/.well-known/agent-card.json`
- UCP: `/.well-known/ucp`
- RFC 8615 (Well-Known URIs)

### 4.2 Manifest Schema (`agent-intake.json`)

```json
{
  "aip_version": "0.1.0",
  "provider": {
    "name": "Man vs Health",
    "url": "https://manvshealth.com",
    "description": "Men's metabolic health optimization platform"
  },
  "intakes": [
    {
      "id": "metabolic-assessment",
      "name": "Metabolic Health Assessment",
      "description": "Submit metabolic markers for personalized optimization plan",
      "endpoint": "https://manvshealth.com/api/aip/metabolic-assessment",
      "method": "POST",
      "category": "health/assessment",
      "input_schema": {
        "type": "object",
        "required": ["age_range", "sex", "primary_concern"],
        "properties": {
          "age_range": { "type": "string", "enum": ["30-39", "40-49", "50-59", "60+"] },
          "sex": { "type": "string", "enum": ["male", "female"] },
          "primary_concern": { "type": "string", "enum": ["weight", "energy", "insulin_resistance", "general"] },
          "fasting_glucose_range": { "type": "string", "enum": ["normal", "elevated", "high", "unknown"] },
          "activity_level": { "type": "string", "enum": ["sedentary", "light", "moderate", "active"] }
        }
      },
      "offer_type": "personalized_recommendation",
      "binding_available": true,
      "requires_auth": false,
      "privacy": {
        "data_retention": "none",
        "pii_required": false,
        "redacted_acceptable": true
      }
    }
  ],
  "certification": {
    "registry": "https://agentintake.io/registry",
    "certified": true,
    "cert_id": "aip-cert-2026-00142",
    "expires": "2027-02-27"
  }
}
```

### 4.3 Intake Lifecycle

```
DISCOVER → SUBMIT → OFFER → [REVIEW] → BIND | DECLINE
```

**Stage 1: DISCOVER**
Agent finds `/.well-known/agent-intake.json`, reads available intakes and their input schemas.

**Stage 2: SUBMIT**
Agent POSTs redacted/anonymized user context to the intake endpoint. No PII required. Agent includes its own identifier and the user's consent scope.

```json
POST /api/aip/metabolic-assessment
{
  "aip_version": "0.1.0",
  "agent": {
    "id": "claude-user-agent-abc123",
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
  "session_id": "uuid-v4"
}
```

**Stage 3: OFFER (Soft-Contract)**
Business returns a structured, non-binding offer:

```json
{
  "aip_version": "0.1.0",
  "session_id": "uuid-v4",
  "status": "offer",
  "offer": {
    "id": "offer-uuid",
    "summary": "Based on your profile, we recommend our Foundation Coaching plan focused on insulin resistance reversal.",
    "details": {
      "recommended_plan": "Foundation Coaching",
      "monthly_cost": 149,
      "currency": "USD",
      "includes": [
        "Personalized Power Foods database",
        "Weekly SMS check-ins",
        "Monthly metabolic review"
      ],
      "estimated_timeline": "90-day initial protocol"
    },
    "expires": "2026-03-06T00:00:00Z",
    "bind_endpoint": "https://manvshealth.com/api/aip/bind",
    "bind_requires": ["email", "full_name"]
  }
}
```

**Stage 4: REVIEW**
Agent takes the offer back to the user. Agent may compare offers from multiple providers. User reviews at their leisure.

**Stage 5: BIND or DECLINE**
User authorizes agent to bind. Agent POSTs to `bind_endpoint` with the required fields (now PII is shared because user opted in). Or user declines — no action needed, offer expires.

```json
POST /api/aip/bind
{
  "offer_id": "offer-uuid",
  "session_id": "uuid-v4",
  "bind_data": {
    "email": "user@example.com",
    "full_name": "John Doe"
  },
  "agent": {
    "id": "claude-user-agent-abc123",
    "consent_scope": ["bind", "account_creation"]
  }
}
```

### 4.4 Use Case Categories

The protocol is intentionally broad. Example categories:

| Category | Example | Intake Data | Offer Type |
|----------|---------|-------------|------------|
| Health/Wellness | Man vs Health | Age, concerns, metrics | Plan recommendation |
| Service Matching | WhoDo | Project type, budget, location | Matched providers |
| SaaS Onboarding | Project management tool | Team size, use case, integrations | Trial + config |
| Financial Services | Insurance quote | Age, coverage type, assets | Quote/premium |
| B2B Vendor | Cloud hosting | Usage estimates, compliance needs | Proposal |
| Education | Online course | Skill level, goals, schedule | Curriculum recommendation |
| Calculator/Tool | BMI, mortgage, ROI | Raw inputs | Computed output (no binding) |

Note: Not all intakes require binding. A calculator intake returns a result and that's the end of it. The protocol supports this — `binding_available: false`.

### 4.5 Protocol Principles

1. **User Sovereignty** — The user always decides. Agents are delegates, not decision-makers.
2. **Privacy by Default** — Intake submissions use redacted, anonymized, or range-based data. PII only flows at bind time, and only what the business explicitly requires.
3. **Non-Binding Offers** — A soft-contract is an offer, not a commitment. Either party can walk away.
4. **Stateless Intake** — Businesses don't need to maintain agent sessions. Each request is self-contained.
5. **Simple Implementation** — A business can implement AIP with a single JSON file and one API endpoint. No LLM, no agent runtime, no complex infrastructure.
6. **Open Standard** — The spec is free, open, MIT-licensed. Anyone can implement it.

---

## 5. Project Structure — Two Deliverables

### Deliverable 1: Open Protocol (Public)
- **GitHub Org:** https://github.com/agent-intake-protocol (CREATED)
- **Repo:** `github.com/agent-intake-protocol/agent-intake-protocol`
- **Site:** GitHub Pages (`agent-intake-protocol.github.io` or custom domain)
- **Contains:** White paper, protocol spec, README, examples, reference implementation
- **License:** MIT

### Deliverable 2: AIP Registry & Certification Service (Private/Commercial)
- **Repo:** AWS CodeCommit (private)
- **Site:** Production AWS deployment (S3 + CloudFront)
- **Contains:** Registry, certification engine, demo/playground, auth, payment
- **Domain:** `agentintake.io` (PURCHASED via Route53)

---

## 6. Deliverable 1: Open Protocol (Public GitHub + GitHub Pages)

### 6.1 Repository Structure

```
agent-intake-protocol/
├── README.md                          # Overview, quick start, badges
├── LICENSE                            # MIT
├── CONTRIBUTING.md                    # How to contribute
├── CHANGELOG.md                      # Version history
├── docs/
│   ├── index.html                     # GitHub Pages landing page
│   ├── whitepaper.html                # Full white paper
│   ├── specification.html             # Protocol spec (versioned)
│   ├── examples.html                  # Example implementations
│   ├── faq.html                       # FAQ
│   └── assets/
│       ├── css/                       # Styling (match protocol site aesthetics)
│       ├── img/                       # Diagrams, logo
│       └── js/                        # Minimal interactivity
├── spec/
│   └── 2026-02-27/                    # Versioned spec (date-based like ACP)
│       ├── agent-intake.schema.json   # JSON Schema for manifest
│       ├── intake-request.schema.json # JSON Schema for submissions
│       ├── offer-response.schema.json # JSON Schema for offers
│       ├── bind-request.schema.json   # JSON Schema for binding
│       └── README.md                  # Spec version notes
├── examples/
│   ├── health-assessment/             # Man vs Health example
│   │   ├── agent-intake.json          # Manifest
│   │   ├── server.js                  # Vanilla JS implementation
│   │   └── README.md
│   ├── service-matching/              # WhoDo-style example
│   │   ├── agent-intake.json
│   │   ├── server.js
│   │   └── README.md
│   ├── calculator/                    # Non-binding calculator example
│   │   ├── agent-intake.json
│   │   ├── server.js
│   │   └── README.md
│   └── saas-onboarding/              # SaaS trial example
│       ├── agent-intake.json
│       ├── server.js
│       └── README.md
└── sdk/
    └── js/                            # Optional: lightweight JS helper
        ├── package.json
        ├── aip-client.js              # Agent-side helper
        └── aip-server.js              # Business-side helper
```

### 6.2 GitHub Pages Site

**Design Requirements:**
- Clean, professional, matches the aesthetic of `a2a-protocol.org`, `agenticcommerce.dev`, `modelcontextprotocol.io`
- Single-page scrolling for spec, multi-page for white paper
- Syntax-highlighted code examples
- Protocol layer diagram showing AIP's position relative to MCP/A2A/UCP/ACP
- Mobile responsive
- Dark/light mode (optional, nice to have)

**Pages:**
1. **Landing** — One-line pitch, layer diagram, quick start code snippet, link to registry
2. **White Paper** — Full document (see 6.3)
3. **Specification** — Technical spec with schemas
4. **Examples** — Walkthrough of each example with code
5. **FAQ** — Common questions, positioning vs other protocols
6. **Registry** — Link out to `agentintake.io` (the commercial site)

### 6.3 White Paper Content Outline

**Title:** "AIP: The Agent Intake Protocol — A Lightweight Open Standard for Agent-Mediated Service Onboarding"

**Sections:**
1. Abstract
2. The Problem: Agents Without a Front Door
3. Existing Protocols and the Gap They Leave
   - MCP: Tools, not relationships
   - A2A: Peers, not delegates
   - UCP/ACP: Products, not services
4. Introducing AIP
   - Core concepts: Discovery, Submit, Offer, Review, Bind
   - The soft-contract primitive
   - Privacy by default
5. Protocol Specification (summary — links to full spec)
6. Use Cases
   - B2C: Health services, education, financial quotes
   - B2B: Vendor evaluation, SaaS onboarding
   - Matching: Service marketplaces
   - Calculators/Tools: Stateless computation
7. Implementation Guide
   - For businesses (adding AIP to your site)
   - For agent developers (consuming AIP endpoints)
8. Trust & Certification
   - The AIP Registry
   - Certification process
9. Comparison Matrix (AIP vs MCP vs A2A vs UCP vs ACP)
10. Why the Internet is Better With AIP
11. Conclusion & Call to Action
12. References

### 6.4 Technology Stack (Protocol Site)

- Static HTML/CSS/JS (vanilla — no frameworks)
- GitHub Pages hosting
- Prism.js or Highlight.js for code syntax highlighting
- Mermaid.js for diagrams (optional)
- No build step required

---

## 7. Deliverable 2: AIP Registry & Certification Service (Private, AWS)

### 7.1 What This Site Does

1. **Registry/Directory** — Searchable list of AIP-compliant endpoints. Businesses can register, agents can discover.
2. **Certification Engine** — Accepts a URL, crawls for `/.well-known/agent-intake.json`, validates against schema, tests endpoints, and issues a certificate upon passing + payment.
3. **Interactive Demo/Playground** — A page where users can see AIP in action. A cheap LLM (Claude Haiku via API) interacts with live AIP endpoints (our own default + test examples) to demonstrate the protocol flow.
4. **Authentication** — Email OTP login for businesses managing their certifications.
5. **Payments** — Stripe integration for certification fees.

### 7.2 Site Pages / Routes

```
/                          # Landing page — what is AIP, why certify, CTA
/registry                  # Public directory of certified AIP endpoints
/registry/{domain}         # Detail page for a specific certified endpoint
/certify                   # Start certification flow (requires auth)
/certify/inspect           # Enter URL, see validation results
/certify/payment           # Stripe checkout for certification
/certify/certificate/{id}  # Public certificate page (shareable badge/link)
/playground                # Interactive demo — LLM talks to AIP endpoints
/dashboard                 # Auth-required — manage your certifications
/login                     # Email OTP login
/verify                    # OTP code entry
/api/...                   # Backend API endpoints (see 7.5)
```

### 7.3 Authentication — Email OTP

Simple, passwordless authentication flow:

1. User enters email on `/login`
2. Backend generates 6-digit OTP, stores in DynamoDB with TTL (10 min expiry)
3. SES sends OTP email
4. User enters OTP on `/verify`
5. Backend validates, issues JWT stored in httpOnly cookie
6. JWT used for subsequent authenticated requests

**No passwords. No OAuth. No social login. Just email OTP.**

### 7.4 Certification Flow

1. User logs in (email OTP)
2. Navigates to `/certify`
3. Enters their domain URL
4. Backend fetches `https://{domain}/.well-known/agent-intake.json`
5. Validates manifest against AIP JSON Schema
6. For each intake endpoint listed:
   - Sends a test SUBMIT request (using synthetic test data)
   - Validates response matches OFFER schema
   - Checks HTTP status codes, headers, CORS
   - If `binding_available: true`, checks that `bind_endpoint` is reachable
7. Generates validation report (pass/fail with details)
8. If passing: presents Stripe payment flow
9. Upon payment: generates certificate record in DynamoDB
10. Certificate includes: cert_id, domain, validated_intakes, issue_date, expiry_date (1 year)
11. Certificate is publicly viewable at `/certify/certificate/{cert_id}`
12. Business can embed a badge/shield linking to their certificate

**Certificate Format:**
Matches patterns from existing trust certificates (SSL certs, security badges). Should display:
- Issuer: AIP Registry (agentintake.io)
- Domain: certified-business.com
- Cert ID: aip-cert-2026-XXXXX
- Issued: date
- Expires: date
- Validated Intakes: list
- Status: ACTIVE / EXPIRED / REVOKED

### 7.5 Backend API Endpoints

All serverless Lambda functions behind API Gateway.

```
# Auth
POST   /api/auth/send-otp        # Send OTP to email
POST   /api/auth/verify-otp      # Verify OTP, return JWT
POST   /api/auth/logout           # Invalidate session

# Registry
GET    /api/registry              # List certified endpoints (paginated)
GET    /api/registry/{domain}     # Get specific registration details
POST   /api/registry/register     # Register a new domain (auth required)

# Certification
POST   /api/certify/inspect       # Validate a URL against AIP spec
POST   /api/certify/purchase      # Create Stripe checkout session
POST   /api/certify/webhook       # Stripe webhook for payment confirmation
GET    /api/certify/cert/{id}     # Get certificate details

# Dashboard
GET    /api/dashboard             # Get user's certifications (auth required)
POST   /api/dashboard/renew/{id}  # Renew a certification

# Playground
POST   /api/playground/execute    # Send user prompt to LLM, LLM interacts with AIP endpoints

# AIP Example Endpoints (our own hosted examples)
GET    /.well-known/agent-intake.json  # Our own AIP manifest
POST   /api/aip-demo/default          # Default example intake
POST   /api/aip-demo/health           # Health assessment example
POST   /api/aip-demo/matching         # Service matching example
POST   /api/aip-demo/calculator       # Calculator example (non-binding)
```

### 7.6 Playground / Demo Page

The playground demonstrates AIP to visitors and teaches AI agents how the protocol works.

**Implementation:**
- Frontend: Text input for user prompt + conversation display
- Backend: Lambda function that calls Claude Haiku (cheap) via Anthropic API
- The LLM's system prompt includes AIP spec knowledge and URLs for our demo endpoints
- The LLM can:
  1. Discover: GET the `/.well-known/agent-intake.json` from our demo
  2. List available intakes to the user
  3. Ask the user for their inputs (matching the intake schema)
  4. Submit: POST to the intake endpoint
  5. Display the offer back to the user
  6. Optionally demonstrate the bind flow

**Available Demo Endpoints:**
- Default (generic): A simple intake that returns a welcome offer
- Health Assessment: Based on Man vs Health model
- Service Matching: Based on WhoDo model
- Calculator: Non-binding computation (BMI calculator, ROI calculator, etc.)
- All test endpoints hosted on our own infrastructure

**Important:** The playground page itself should explain the protocol visually alongside the chat interface. Show the raw HTTP requests/responses in a side panel so developers can see exactly what's happening under the hood.

### 7.7 SES Email Configuration

- **Sending Domain:** `agentintake.io` (or chosen domain)
- **OTP Emails:** Sent from `auth@agentintake.io`
- **Test Email Forwarding Rule:** 
  - Create SES rule set: emails to `*@test.agentintake.io` → S3 bucket (`aip-test-emails`)
  - This enables end-to-end testing of OTP flow without real email delivery
  - Test suite reads OTP from S3 bucket to complete auth flow automatically

### 7.8 Stripe Integration

- **Mode:** Sandbox/test initially. Production when ready.
- **Product:** AIP Certification (annual)
- **Pricing:** TBD — suggest $99/year for v1 (low barrier, premium comes later)
- **Flow:** 
  1. After successful inspection, user clicks "Get Certified"
  2. Backend creates Stripe Checkout Session
  3. User completes payment on Stripe-hosted page
  4. Stripe webhook hits `/api/certify/webhook`
  5. Backend creates certificate record in DynamoDB

### 7.9 Data Model (DynamoDB)

```
Table: aip-users
  PK: email
  Fields: created_at, last_login, jwt_session_id

Table: aip-otp
  PK: email
  SK: otp_code
  Fields: created_at, ttl (10 min), used

Table: aip-certifications
  PK: cert_id (aip-cert-YYYY-XXXXX)
  GSI1 PK: domain
  GSI1 SK: cert_id
  GSI2 PK: email (owner)
  Fields: domain, email, validated_intakes[], issued_at, expires_at, 
          status (ACTIVE/EXPIRED/REVOKED), stripe_payment_id, 
          inspection_report, manifest_snapshot

Table: aip-registry
  PK: domain
  Fields: cert_id, provider_name, provider_url, description, 
          intakes_summary[], category_tags[], certified, 
          created_at, updated_at
```

---

## 8. Architecture

### 8.1 Protocol Site (Deliverable 1)

```
GitHub Repository
    └── GitHub Pages (static site)
        ├── White paper
        ├── Spec
        ├── Examples
        └── Links to agentintake.io
```

No backend. Pure static.

### 8.2 Registry & Certification Service (Deliverable 2)

```
                    ┌─────────────────┐
                    │   CloudFront    │
                    │   CDN + HTTPS   │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │   S3 Bucket     │
                    │   (Static Site) │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │    API Gateway (HTTP API)    │
              └──────────────┬──────────────┘
                             │
         ┌───────┬───────┬───┴───┬───────┬────────┐
         │       │       │       │       │        │
      Auth    Registry  Certify  Play   Demo    Stripe
      Lambda  Lambda    Lambda   Lambda Lambda  Webhook
         │       │       │       │       │     Lambda
         │       │       │       │       │        │
         └───────┴───────┴───┬───┴───────┘        │
                             │                     │
                    ┌────────┴────────┐            │
                    │   DynamoDB      │            │
                    │   (All tables)  │            │
                    └─────────────────┘            │
                                                   │
                    ┌─────────────────┐            │
                    │   SES           │            │
                    │   (OTP Emails)  │            │
                    └─────────────────┘            │
                                                   │
                    ┌─────────────────┐            │
                    │   Anthropic API │      ┌─────┴─────┐
                    │   (Playground)  │      │  Stripe   │
                    └─────────────────┘      └───────────┘
                    
                    ┌─────────────────┐
                    │   S3 Bucket     │
                    │   (Test Emails) │
                    └─────────────────┘
```

### 8.3 Local Development

- **SAM CLI** for local Lambda invocation
- **DynamoDB:** Use local mock approach — either `dynamodb-local` Docker container or simple local JSON/CSV file adapter
  - Recommend: lightweight abstraction layer that reads/writes to local JSON files in dev, DynamoDB in prod
  - Single env var toggle: `AIP_STORAGE=local` vs `AIP_STORAGE=dynamodb`
- **SES:** For local dev, log emails to console. For staging, use SES sandbox + S3 rule.
- **Stripe:** Test mode with Stripe CLI for webhook forwarding
- **Frontend:** Serve static files directly (no build step)

### 8.4 Infrastructure as Code

- **SAM (Serverless Application Model)** template for all AWS resources
- `template.yaml` defines: Lambda functions, API Gateway, DynamoDB tables, S3 buckets, CloudFront distribution, SES configuration
- `samconfig.toml` for deployment profiles (local, staging, prod)

---

## 9. Implementation Details

### 9.1 Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Frontend (both sites) | Vanilla HTML/CSS/JS | Paul's preference, minimal token cost, no build step |
| Backend (Lambdas) | Node.js 20 (vanilla JS) | Consistent with frontend, fast cold starts |
| Database | DynamoDB | Serverless, pay-per-request, no idle costs |
| Email | AWS SES | Already in Paul's stack, reliable |
| Payments | Stripe | Industry standard, good sandbox |
| CDN/Hosting | CloudFront + S3 | Standard AWS pattern, cheap |
| AI (Playground) | Claude Haiku via Anthropic API | Cheapest capable model for demo |
| IaC | SAM | Simplest AWS serverless IaC |
| Local Dev | SAM Local + JSON file storage | No Docker dependencies for DB |

### 9.2 Project Conventions

- **No frameworks** — no React, no Next, no Express. Vanilla only.
- **No build step** — HTML/CSS/JS served as-is
- **Lambda handler pattern:** Each route is its own handler file in `src/handlers/`
- **Shared utilities:** `src/lib/` for DynamoDB client, SES client, auth middleware, AIP validator
- **Environment variables:** All config via env vars, no config files
- **Error handling:** Consistent JSON error responses `{ "error": "message", "code": "ERROR_CODE" }`

---

## 10. Domain & Branding

### 10.1 Domain Recommendations

Following the naming patterns of existing protocol sites:

| Protocol | Domain |
|----------|--------|
| A2A | a2a-protocol.org, a2aprotocol.ai |
| ACP | agenticcommerce.dev |
| UCP | (part of Google developer docs) |
| MCP | modelcontextprotocol.io |

**Domain Selection:**

1. `agentintake.io` — **PURCHASED** — Registered via Route53 ($71/yr)

**GitHub Organization:** https://github.com/agent-intake-protocol (CREATED)

**Decision:** `agentintake.io` for the commercial registry site. The protocol spec lives on GitHub Pages under the `agent-intake-protocol` GitHub organization.

### 10.2 Branding

- **Logo:** Simple, geometric, suggesting intake/funnel/handshake
- **Colors:** Should complement (not clash with) MCP blue, A2A green, ACP purple
  - Suggestion: Warm orange/amber — represents warmth of welcome, distinct from competitors
- **Typography:** System fonts or Inter/IBM Plex Sans (clean, technical)
- **Badge/Shield:** For certified sites to embed — similar to SSL certificate badges

---

## 11. Testing Strategy

### 11.1 Protocol Site (Deliverable 1)

- HTML validation (W3C)
- Link checking
- Mobile responsiveness testing
- JSON Schema validation for all spec examples

### 11.2 Registry & Certification Service (Deliverable 2)

**Unit Tests:**
- AIP manifest validator (valid/invalid manifests)
- OTP generation and verification logic
- Certificate generation logic
- Stripe webhook signature validation

**Integration Tests:**
- Full OTP login flow (using SES → S3 test email bucket)
- Full certification flow (inspect → pay → certificate)
- Registry CRUD operations
- Playground LLM interaction

**End-to-End Tests (Playwright):**
- User visits site → registers → certifies a domain → views certificate
- User visits playground → interacts with demo
- Public visitor browses registry
- OTP email flow using S3 email forwarding bucket

**Test Infrastructure:**
- SES rule: `*@test.{domain}` → S3 bucket `aip-test-emails`
- Playwright reads OTP from S3 bucket to complete auth flows
- Stripe test mode with test card numbers
- All demo AIP endpoints are also test targets

### 11.3 Man vs Health Production Test

After deploying the registry:
1. Add `/.well-known/agent-intake.json` to `manvshealth.com`
2. Implement a simple metabolic assessment intake endpoint on MVH
3. Use the registry certification flow to certify MVH
4. Verify the certificate appears in the public registry
5. Use the playground to demonstrate an agent interacting with MVH's AIP endpoint

---

## 12. Project Management

### 12.1 Documents to Create

For the **Protocol Repository** (public):
- [ ] `README.md`
- [ ] `LICENSE` (MIT)
- [ ] `CONTRIBUTING.md`
- [ ] `CHANGELOG.md`
- [ ] White paper (HTML for GitHub Pages)
- [ ] Protocol specification (HTML for GitHub Pages)
- [ ] JSON Schemas (spec/)
- [ ] Example implementations (examples/)
- [ ] GitHub Pages site (docs/)

For the **Registry/Certification Service** (private):
- [ ] `README.md` — project overview, local dev setup
- [ ] `ARCHITECTURE.md` — system architecture document
- [ ] `TODO.md` — prioritized task list
- [ ] `template.yaml` — SAM template
- [ ] `samconfig.toml` — SAM deployment config
- [ ] `src/` — all Lambda handler code
- [ ] `site/` — static frontend files
- [ ] `tests/` — all test files
- [ ] `.env.example` — environment variables template

### 12.2 Task Prioritization (Suggested Build Order)

**Phase 1: Protocol Foundation**
1. Write the AIP specification (JSON schemas first)
2. Build example implementations (start with health assessment)
3. Write the white paper
4. Build the GitHub Pages site
5. Publish to public GitHub

**Phase 2: Registry MVP**
1. AWS infrastructure setup (SAM template, S3, CloudFront, DynamoDB)
2. Purchase domain, configure DNS + SSL
3. Static site shell (landing, registry, certify pages)
4. Email OTP auth flow
5. SES setup + test email forwarding
6. Certification inspection engine (fetch + validate manifest)
7. Stripe integration (sandbox)
8. Certificate generation and display
9. Public registry listing page

**Phase 3: Playground & Demo**
1. Build demo AIP endpoints (our own examples)
2. Playground Lambda (Anthropic API integration)
3. Playground frontend (chat + HTTP inspector panel)
4. Connect playground to demo endpoints

**Phase 4: Production Test**
1. Add AIP to manvshealth.com
2. Certify MVH through the registry
3. Demo with playground

**Phase 5: Polish & Launch**
1. End-to-end Playwright tests
2. Certificate badge/shield embeddable
3. SEO, meta tags, social sharing
4. Announce

### 12.3 Backlog (Future)

Items explicitly deferred:
- [ ] Turnkey setup service (consulting to implement AIP for businesses)
- [ ] Premium tier (analytics dashboard — agent hit counts, conversion rates)
- [ ] API access for programmatic registry queries
- [ ] Agent SDK packages (npm, pip)
- [ ] Automated re-certification (periodic re-validation)
- [ ] Multi-language spec translations
- [ ] Crawler that discovers AIP endpoints across the web
- [ ] Integration examples with MCP, A2A
- [ ] Community contributions process
- [ ] WhoDo AIP implementation
- [ ] Mobile-friendly certificate viewer

---

## 13. Open Decisions / Questions

All decisions are now resolved:

1. **Domain:** ✅ PURCHASED — `agentintake.io` via Route53
2. **GitHub Org:** ✅ CREATED — https://github.com/agent-intake-protocol
3. **Certification Pricing:** ✅ $99/year
3. **Free Tier:** ✅ Yes — free unverified listings + paid certification upgrade
4. **Playground LLM Budget:** ✅ 5 free demo interactions per visitor per day (rate limit by IP via DynamoDB TTL record, no auth required)
5. **Protocol Versioning:** ✅ Dual: semver (`0.1.0`) + date-based snapshots (`2026-02-27/`)
6. **Badge Design:** Defer to implementation — shield-style, similar to SSL cert badges
7. **Initial Categories:** Defer to implementation — start with: health/assessment, service/matching, saas/onboarding, finance/quote, tool/calculator, b2b/vendor
8. **Cert Expiry:** ✅ 1 year
9. **Re-certification:** ✅ Automatic re-crawl built in (periodic validation, revoke if consistently failing)
10. **GitHub org:** ✅ CREATED — https://github.com/agent-intake-protocol

---

## Summary of Deliverables

| Deliverable | Hosting | Repo | Stack |
|-------------|---------|------|-------|
| AIP Protocol Spec + White Paper + Site | GitHub Pages | Public GitHub | Static HTML/CSS/JS |
| AIP Registry + Certification + Playground | AWS (S3 + CF + Lambda + DDB) | AWS CodeCommit (private) | Vanilla JS, SAM, DynamoDB, SES, Stripe, Anthropic API |

**Domain:** `agentintake.io`
**GitHub Org:** `agent-intake-protocol`
**Cert Price:** $99/year
**Free Tier:** Unverified listings free, certification paid
**Playground:** 5 interactions/visitor/day

**End state:** A user visits the protocol site, understands AIP, goes to their business codebase, adds `/.well-known/agent-intake.json` and an endpoint. Then visits `agentintake.io`, certifies their endpoint, gets a badge. AI agents can now discover and intake on behalf of their users. The playground demonstrates all of this live.

---

*This document is the authoritative requirements source for the AIP project. All implementation decisions should reference this document. Updates should be versioned and dated.*
