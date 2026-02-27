const http = require('node:http');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');

const PORT = process.env.PORT || 3003;
const HOST = `http://localhost:${PORT}`;

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'agent-intake.json'), 'utf8')
);
manifest.intakes[0].endpoint = `${HOST}/api/aip/trial-setup`;

// Plan configurations based on team size
const PLANS = {
  solo: { plan: 'Starter', price: 0, trial_days: 14, max_projects: 3 },
  '2-5': { plan: 'Team', price: 12, trial_days: 14, max_projects: 10 },
  '6-20': { plan: 'Business', price: 20, trial_days: 30, max_projects: 50 },
  '21-50': { plan: 'Business Plus', price: 18, trial_days: 30, max_projects: 100 },
  '51-200': { plan: 'Enterprise', price: 15, trial_days: 30, max_projects: 'Unlimited' },
  '200+': { plan: 'Enterprise', price: 'Custom', trial_days: 30, max_projects: 'Unlimited' }
};

// Template suggestions based on use case
const TEMPLATES = {
  software_dev: ['Sprint Board', 'Bug Tracker', 'Product Roadmap', 'Release Planning'],
  marketing: ['Campaign Tracker', 'Content Calendar', 'Brand Assets', 'Social Media Planner'],
  design: ['Design System', 'Creative Briefs', 'Asset Library', 'Review & Approval'],
  operations: ['Process Tracker', 'Inventory Management', 'Vendor Management', 'SOP Library'],
  consulting: ['Client Projects', 'Time & Billing', 'Proposal Tracker', 'Resource Allocation'],
  general: ['Task Board', 'Team Wiki', 'Meeting Notes', 'Project Timeline']
};

// Migration guides for common tools
const MIGRATION_GUIDES = {
  jira: 'Automated Jira import available — issues, sprints, and epics transfer directly.',
  asana: 'One-click Asana import — tasks, sections, and assignees preserved.',
  trello: 'Trello board import — cards, lists, labels, and attachments included.',
  monday: 'monday.com CSV export supported — we map columns to custom fields.',
  notion: 'Notion database import — pages convert to docs, databases to boards.',
  linear: 'Linear import via API — issues, cycles, and labels transfer seamlessly.',
  clickup: 'ClickUp import — spaces, folders, and lists map to our hierarchy.',
  spreadsheets: 'CSV/Excel import — we auto-detect columns and create matching fields.'
};

const activeOffers = new Map();

function generateTrialConfig(intakeData) {
  const { team_size, use_case, current_tools, integrations_needed, priority_features } = intakeData;

  const planConfig = PLANS[team_size] || PLANS['2-5'];
  const templates = TEMPLATES[use_case] || TEMPLATES.general;

  const migrations = (current_tools || [])
    .filter(tool => tool !== 'none' && MIGRATION_GUIDES[tool])
    .map(tool => ({ from: tool, guide: MIGRATION_GUIDES[tool] }));

  const integrations = (integrations_needed || []).map(i => ({
    name: i,
    status: 'ready_to_connect',
    setup_time: '2 minutes'
  }));

  return {
    recommended_plan: planConfig.plan,
    price_per_user_month: planConfig.price,
    currency: 'USD',
    trial_days: planConfig.trial_days,
    max_projects: planConfig.max_projects,
    pre_configured: {
      templates,
      integrations,
      migrations,
      features_enabled: priority_features || ['kanban', 'docs']
    }
  };
}

function handleRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/.well-known/agent-intake.json') {
    res.writeHead(200);
    res.end(JSON.stringify(manifest, null, 2));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/aip/trial-setup') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const request = JSON.parse(body);
        const { intake_data, session_id } = request;

        if (!intake_data || !session_id) {
          res.writeHead(400);
          res.end(JSON.stringify({
            aip_version: '0.1.0', session_id: session_id || null,
            status: 'error',
            error: { code: 'INVALID_INPUT', message: 'Missing intake_data or session_id' }
          }));
          return;
        }

        if (!intake_data.team_size || !intake_data.use_case) {
          res.writeHead(400);
          res.end(JSON.stringify({
            aip_version: '0.1.0', session_id,
            status: 'error',
            error: { code: 'SCHEMA_MISMATCH', message: 'Missing required fields: team_size, use_case' }
          }));
          return;
        }

        const config = generateTrialConfig(intake_data);
        const offerId = crypto.randomUUID();
        const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

        activeOffers.set(offerId, { session_id, intake_data, config, expires });

        const priceStr = config.price_per_user_month === 0
          ? 'Free'
          : config.price_per_user_month === 'Custom'
            ? 'Custom pricing'
            : `$${config.price_per_user_month}/user/mo`;

        const response = {
          aip_version: '0.1.0',
          session_id,
          status: 'offer',
          offer: {
            id: offerId,
            summary: `We recommend the ${config.recommended_plan} plan (${priceStr}) with a ${config.trial_days}-day free trial. We'll pre-configure ${config.pre_configured.templates.length} templates for ${intake_data.use_case} workflows.`,
            details: config,
            expires,
            bind_endpoint: `${HOST}/api/aip/bind`,
            bind_requires: ['email', 'full_name']
          }
        };

        res.writeHead(200);
        res.end(JSON.stringify(response, null, 2));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({
          aip_version: '0.1.0', session_id: null,
          status: 'error',
          error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' }
        }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/aip/bind') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const request = JSON.parse(body);
        const { offer_id, bind_data } = request;

        const offer = activeOffers.get(offer_id);
        if (!offer) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Offer not found or expired' }));
          return;
        }

        if (!bind_data.email || !bind_data.full_name) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Bind requires email and full_name' }));
          return;
        }

        activeOffers.delete(offer_id);

        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'bound',
          message: `Welcome to TaskFlow, ${bind_data.full_name}! Your ${offer.config.recommended_plan} trial is ready.`,
          workspace: {
            url: `https://taskflow.example.com/workspace/demo-${Date.now()}`,
            trial_expires: new Date(Date.now() + offer.config.trial_days * 24 * 60 * 60 * 1000).toISOString(),
            templates_loaded: offer.config.pre_configured.templates,
            next_steps: [
              'Check your email for login credentials',
              'Invite your team members',
              'Explore your pre-configured templates'
            ]
          }
        }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`\n  TaskFlow — AIP SaaS Onboarding Example`);
  console.log(`  ========================================`);
  console.log(`  Server running at ${HOST}\n`);
  console.log(`  Endpoints:`);
  console.log(`    GET  ${HOST}/.well-known/agent-intake.json`);
  console.log(`    POST ${HOST}/api/aip/trial-setup`);
  console.log(`    POST ${HOST}/api/aip/bind\n`);
});
