# Contributing to AIP

Thank you for your interest in contributing to the Agent Intake Protocol. AIP is an open standard and we welcome contributions from the community.

## Ways to Contribute

### Report Issues
- Found a bug in an example? Open an issue.
- Spec ambiguity? Open an issue with the `spec` label.
- Typo or unclear documentation? PRs welcome.

### Propose Changes to the Specification
1. Open an issue describing the proposed change and its rationale.
2. Tag it with `spec-proposal`.
3. Discussion happens in the issue thread.
4. If accepted, submit a PR with the schema and documentation changes.

### Add Examples
We welcome example implementations in any language:
1. Fork the repo.
2. Create a new directory under `examples/` with a descriptive name.
3. Include: `agent-intake.json` (manifest), server implementation, and `README.md`.
4. Ensure your example conforms to the current spec version schemas.
5. Submit a PR.

### Improve Documentation
- The docs site lives in `docs/`.
- PRs for clarity, typos, or additional content are always welcome.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/agent-intake-protocol/agent-intake-protocol.git
cd agent-intake-protocol

# Run any example
cd examples/health-assessment
node server.js
# Server starts on http://localhost:3000
```

No build tools required. Everything is vanilla HTML/CSS/JS and Node.js.

## Code Style

- **JavaScript**: Vanilla Node.js, no frameworks. Use `const`/`let`, arrow functions, template literals.
- **JSON Schemas**: Follow JSON Schema Draft 2020-12.
- **HTML/CSS**: Semantic HTML5, no CSS frameworks.

## Pull Request Process

1. Fork and create a feature branch from `main`.
2. Make your changes.
3. Ensure all examples still work (`node server.js` in each).
4. Update documentation if your change affects the spec or examples.
5. Submit a PR with a clear description of the change.

## Spec Versioning

- The specification uses dual versioning: semver (`0.1.0`) and date-based snapshots (`2026-02-27/`).
- Breaking changes to the spec require a new version directory under `spec/`.
- Non-breaking clarifications can be made to the current version.

## Code of Conduct

Be respectful, constructive, and welcoming. We're building an open standard — collaboration is the point.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
