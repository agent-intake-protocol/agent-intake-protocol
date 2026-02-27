/**
 * AIP Server — Business-side helper for implementing AIP endpoints.
 *
 * Usage:
 *   const { AIPServer } = require('@aip/sdk/server');
 *
 *   const aip = new AIPServer({
 *     provider: { name: 'My Business', url: 'https://mybiz.com' },
 *     baseUrl: 'https://mybiz.com'
 *   });
 *
 *   aip.addIntake({
 *     id: 'quote',
 *     name: 'Get a Quote',
 *     category: 'b2b/vendor',
 *     inputSchema: { ... },
 *     handler: async (intakeData) => ({ summary: '...', details: { ... } })
 *   });
 *
 *   // Attach to Node.js http server
 *   const server = http.createServer(aip.requestHandler());
 */

const crypto = require('node:crypto');

class AIPServer {
  /**
   * @param {object} options
   * @param {object} options.provider - Provider info { name, url, description? }
   * @param {string} options.baseUrl - Base URL for generating endpoint URLs
   * @param {string} [options.version] - AIP version (default '0.1.0')
   */
  constructor(options) {
    this.provider = options.provider;
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.version = options.version || '0.1.0';
    this.intakes = [];
    this.handlers = new Map();
    this.bindHandlers = new Map();
    this.activeOffers = new Map();
  }

  /**
   * Register an intake endpoint.
   * @param {object} config
   * @param {string} config.id - Unique intake identifier
   * @param {string} config.name - Human-readable name
   * @param {string} [config.description] - Description
   * @param {string} [config.category] - Category (e.g., 'health/assessment')
   * @param {object} config.inputSchema - JSON Schema for intake_data
   * @param {string} [config.offerType] - Offer type (default 'quote')
   * @param {boolean} [config.bindingAvailable] - Whether binding is available (default true)
   * @param {string[]} [config.bindRequires] - Fields required for binding
   * @param {Function} config.handler - async (intakeData, session) => { summary, details }
   * @param {Function} [config.onBind] - async (bindData, offer) => result
   */
  addIntake(config) {
    const path = `/api/aip/${config.id}`;
    const endpoint = `${this.baseUrl}${path}`;

    const intake = {
      id: config.id,
      name: config.name,
      description: config.description || config.name,
      endpoint,
      method: 'POST',
      category: config.category,
      input_schema: config.inputSchema,
      offer_type: config.offerType || 'quote',
      binding_available: config.bindingAvailable !== false,
      requires_auth: false,
      privacy: {
        data_retention: 'none',
        pii_required: false,
        redacted_acceptable: true
      }
    };

    this.intakes.push(intake);
    this.handlers.set(path, config.handler);

    if (config.onBind) {
      this.bindHandlers.set(config.id, config.onBind);
    }
  }

  /**
   * Generate the agent-intake.json manifest.
   * @returns {object}
   */
  getManifest() {
    return {
      aip_version: this.version,
      provider: this.provider,
      intakes: this.intakes
    };
  }

  /**
   * Create a Node.js http request handler.
   * @returns {Function} (req, res) => void
   */
  requestHandler() {
    return (req, res) => {
      // CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', 'application/json');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Discovery
      if (req.method === 'GET' && req.url === '/.well-known/agent-intake.json') {
        res.writeHead(200);
        res.end(JSON.stringify(this.getManifest(), null, 2));
        return;
      }

      // Intake endpoints
      if (req.method === 'POST' && this.handlers.has(req.url)) {
        this._handleIntake(req, res, req.url);
        return;
      }

      // Bind endpoint
      if (req.method === 'POST' && req.url === '/api/aip/bind') {
        this._handleBind(req, res);
        return;
      }

      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    };
  }

  _handleIntake(req, res, path) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const request = JSON.parse(body);
        const { intake_data, session_id } = request;

        if (!intake_data || !session_id) {
          res.writeHead(400);
          res.end(JSON.stringify({
            aip_version: this.version,
            session_id: session_id || null,
            status: 'error',
            error: { code: 'INVALID_INPUT', message: 'Missing intake_data or session_id' }
          }));
          return;
        }

        const handler = this.handlers.get(path);
        const result = await handler(intake_data, { session_id, agent: request.agent });

        const offerId = crypto.randomUUID();
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        // Find the intake config for bind info
        const intakeConfig = this.intakes.find(i => i.endpoint.endsWith(path));
        const bindRequires = intakeConfig?.binding_available
          ? (result.bind_requires || ['email', 'full_name'])
          : undefined;

        // Store the offer
        this.activeOffers.set(offerId, {
          session_id, intake_data, result, intakeId: intakeConfig?.id
        });

        const offer = {
          id: offerId,
          summary: result.summary,
          details: result.details,
          expires
        };

        if (intakeConfig?.binding_available) {
          offer.bind_endpoint = `${this.baseUrl}/api/aip/bind`;
          offer.bind_requires = bindRequires;
        }

        res.writeHead(200);
        res.end(JSON.stringify({
          aip_version: this.version,
          session_id,
          status: 'offer',
          offer
        }, null, 2));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({
          aip_version: this.version,
          session_id: null,
          status: 'error',
          error: { code: 'INTERNAL_ERROR', message: 'Failed to process intake' }
        }));
      }
    });
  }

  _handleBind(req, res) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const request = JSON.parse(body);
        const { offer_id, bind_data } = request;

        const offer = this.activeOffers.get(offer_id);
        if (!offer) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Offer not found or expired' }));
          return;
        }

        const bindHandler = this.bindHandlers.get(offer.intakeId);
        let result;

        if (bindHandler) {
          result = await bindHandler(bind_data, offer);
        } else {
          result = {
            status: 'bound',
            message: `Binding confirmed for offer ${offer_id}.`
          };
        }

        this.activeOffers.delete(offer_id);

        res.writeHead(200);
        res.end(JSON.stringify(result, null, 2));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to process bind request' }));
      }
    });
  }
}

module.exports = { AIPServer };
