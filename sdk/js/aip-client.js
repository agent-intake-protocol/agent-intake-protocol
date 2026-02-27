/**
 * AIP Client — Agent-side helper for consuming AIP endpoints.
 *
 * Usage:
 *   const { AIPClient } = require('@aip/sdk/client');
 *   const client = new AIPClient('https://example.com');
 *   const manifest = await client.discover();
 *   const offer = await client.submit('intake-id', { key: 'value' });
 *   const result = await client.bind(offer.offer.id, offer.session_id, { email: '...' });
 */

const crypto = require('node:crypto');

class AIPClient {
  /**
   * @param {string} baseUrl - The provider's base URL (e.g., 'https://example.com')
   * @param {object} [options]
   * @param {string} [options.agentId] - Agent identifier
   * @param {string} [options.platform] - Agent platform name
   * @param {string[]} [options.consentScope] - Default consent scopes
   */
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.agentId = options.agentId || `aip-client-${crypto.randomUUID().slice(0, 8)}`;
    this.platform = options.platform || 'custom';
    this.consentScope = options.consentScope || ['intake', 'offer'];
    this.manifest = null;
  }

  /**
   * Discover — Fetch the provider's AIP manifest.
   * @returns {Promise<object>} The parsed agent-intake.json manifest
   */
  async discover() {
    const url = `${this.baseUrl}/.well-known/agent-intake.json`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new AIPError('DISCOVERY_FAILED', `Failed to fetch manifest: ${res.status} ${res.statusText}`, url);
    }

    this.manifest = await res.json();

    if (!this.manifest.aip_version || !this.manifest.intakes) {
      throw new AIPError('INVALID_MANIFEST', 'Manifest missing required fields: aip_version, intakes', url);
    }

    return this.manifest;
  }

  /**
   * List available intakes from the cached manifest.
   * @returns {object[]} Array of intake definitions
   */
  listIntakes() {
    if (!this.manifest) {
      throw new AIPError('NO_MANIFEST', 'Call discover() first');
    }
    return this.manifest.intakes;
  }

  /**
   * Get a specific intake by ID.
   * @param {string} intakeId
   * @returns {object} The intake definition
   */
  getIntake(intakeId) {
    if (!this.manifest) {
      throw new AIPError('NO_MANIFEST', 'Call discover() first');
    }
    const intake = this.manifest.intakes.find(i => i.id === intakeId);
    if (!intake) {
      throw new AIPError('INTAKE_NOT_FOUND', `No intake with id '${intakeId}'`);
    }
    return intake;
  }

  /**
   * Submit — POST intake data to a specific intake endpoint.
   * @param {string} intakeId - The intake ID from the manifest
   * @param {object} intakeData - The data to submit (matching the intake's input_schema)
   * @param {object} [options]
   * @param {string} [options.sessionId] - Custom session ID (auto-generated if not provided)
   * @returns {Promise<object>} The offer response
   */
  async submit(intakeId, intakeData, options = {}) {
    const intake = this.getIntake(intakeId);
    const sessionId = options.sessionId || crypto.randomUUID();

    const payload = {
      aip_version: this.manifest.aip_version,
      agent: {
        id: this.agentId,
        platform: this.platform,
        consent_scope: this.consentScope
      },
      intake_data: intakeData,
      session_id: sessionId
    };

    const res = await fetch(intake.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const response = await res.json();

    if (response.status === 'error') {
      throw new AIPError(response.error?.code || 'SUBMIT_ERROR', response.error?.message || 'Intake submission failed');
    }

    return response;
  }

  /**
   * Bind — Accept an offer by sending user-authorized PII.
   * @param {string} offerId - The offer ID from the offer response
   * @param {string} sessionId - The session ID from the offer response
   * @param {object} bindData - The PII data (email, name, etc.)
   * @param {object} [options]
   * @param {string} [options.bindEndpoint] - Override the bind endpoint URL
   * @returns {Promise<object>} The bind response
   */
  async bind(offerId, sessionId, bindData, options = {}) {
    const bindEndpoint = options.bindEndpoint;
    if (!bindEndpoint) {
      throw new AIPError('NO_BIND_ENDPOINT', 'Bind endpoint URL is required. Pass it from the offer response.');
    }

    const payload = {
      offer_id: offerId,
      session_id: sessionId,
      bind_data: bindData,
      agent: {
        id: this.agentId,
        consent_scope: [...new Set([...this.consentScope, 'bind'])]
      }
    };

    const res = await fetch(bindEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return res.json();
  }

  /**
   * Full flow — Discover, submit, and optionally bind in sequence.
   * @param {string} intakeId
   * @param {object} intakeData
   * @param {object} [bindData] - If provided, will attempt to bind after receiving offer
   * @returns {Promise<{manifest: object, offer: object, bind?: object}>}
   */
  async fullFlow(intakeId, intakeData, bindData) {
    const manifest = await this.discover();
    const offer = await this.submit(intakeId, intakeData);

    const result = { manifest, offer };

    if (bindData && offer.status === 'offer' && offer.offer?.bind_endpoint) {
      result.bind = await this.bind(
        offer.offer.id,
        offer.session_id,
        bindData,
        { bindEndpoint: offer.offer.bind_endpoint }
      );
    }

    return result;
  }
}

class AIPError extends Error {
  constructor(code, message, url) {
    super(message);
    this.name = 'AIPError';
    this.code = code;
    this.url = url;
  }
}

module.exports = { AIPClient, AIPError };
