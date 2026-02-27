const http = require('node:http');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');

const PORT = process.env.PORT || 3000;
const HOST = `http://localhost:${PORT}`;

// Load the manifest
const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'agent-intake.json'), 'utf8')
);
// Rewrite endpoint URLs to localhost for local dev
manifest.intakes[0].endpoint = `${HOST}/api/aip/metabolic-assessment`;

// Plan database keyed by concern + risk factors
const PLANS = {
  insulin_resistance: {
    high_risk: {
      plan: 'Intensive Metabolic Reset',
      monthly_cost: 249,
      includes: [
        'Personalized Power Foods database (insulin-focused)',
        'Daily glucose tracking protocol',
        'Bi-weekly coaching calls',
        'Monthly metabolic panel review',
        'Supplement protocol'
      ],
      timeline: '90-day intensive protocol'
    },
    moderate_risk: {
      plan: 'Foundation Coaching',
      monthly_cost: 149,
      includes: [
        'Personalized Power Foods database',
        'Weekly SMS check-ins',
        'Monthly metabolic review',
        'Meal timing optimization guide'
      ],
      timeline: '90-day initial protocol'
    }
  },
  weight: {
    plan: 'Weight Optimization Program',
    monthly_cost: 149,
    includes: [
      'Personalized Power Foods database',
      'Weekly weigh-in tracking',
      'Bi-weekly coaching calls',
      'Metabolic rate assessment'
    ],
    timeline: '12-week program'
  },
  energy: {
    plan: 'Energy & Vitality Protocol',
    monthly_cost: 129,
    includes: [
      'Sleep and recovery optimization',
      'Personalized Power Foods database',
      'Monthly hormone panel review',
      'Supplement recommendations'
    ],
    timeline: '8-week protocol'
  },
  general: {
    plan: 'Comprehensive Health Assessment',
    monthly_cost: 99,
    includes: [
      'Full metabolic panel review',
      'Personalized Power Foods database',
      'Monthly check-in',
      'Health optimization roadmap'
    ],
    timeline: '90-day assessment period'
  }
};

// Store active offers in memory (production would use a database)
const activeOffers = new Map();

function generateOffer(intakeData) {
  const { primary_concern, fasting_glucose_range, age_range, activity_level } = intakeData;

  let planData;
  if (primary_concern === 'insulin_resistance') {
    const isHighRisk = fasting_glucose_range === 'high' ||
      (fasting_glucose_range === 'elevated' && activity_level === 'sedentary');
    planData = isHighRisk
      ? PLANS.insulin_resistance.high_risk
      : PLANS.insulin_resistance.moderate_risk;
  } else {
    planData = PLANS[primary_concern] || PLANS.general;
  }

  // Adjust pricing for age — seniors get a discount
  let cost = planData.monthly_cost;
  if (age_range === '60+') {
    cost = Math.round(cost * 0.85);
  }

  return {
    recommended_plan: planData.plan,
    monthly_cost: cost,
    currency: 'USD',
    includes: planData.includes,
    estimated_timeline: planData.timeline
  };
}

function handleRequest(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Discovery: serve the manifest
  if (req.method === 'GET' && req.url === '/.well-known/agent-intake.json') {
    res.writeHead(200);
    res.end(JSON.stringify(manifest, null, 2));
    return;
  }

  // Intake: metabolic assessment
  if (req.method === 'POST' && req.url === '/api/aip/metabolic-assessment') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const request = JSON.parse(body);
        const { intake_data, session_id } = request;

        if (!intake_data || !session_id) {
          res.writeHead(400);
          res.end(JSON.stringify({
            aip_version: '0.1.0',
            session_id: session_id || null,
            status: 'error',
            error: { code: 'INVALID_INPUT', message: 'Missing intake_data or session_id' }
          }));
          return;
        }

        // Validate required fields
        if (!intake_data.age_range || !intake_data.sex || !intake_data.primary_concern) {
          res.writeHead(400);
          res.end(JSON.stringify({
            aip_version: '0.1.0',
            session_id,
            status: 'error',
            error: { code: 'SCHEMA_MISMATCH', message: 'Missing required fields: age_range, sex, primary_concern' }
          }));
          return;
        }

        const offerDetails = generateOffer(intake_data);
        const offerId = crypto.randomUUID();
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        // Store the offer
        activeOffers.set(offerId, { session_id, intake_data, offerDetails, expires });

        const response = {
          aip_version: '0.1.0',
          session_id,
          status: 'offer',
          offer: {
            id: offerId,
            summary: `Based on your profile (${intake_data.age_range}, ${intake_data.primary_concern}), we recommend our ${offerDetails.recommended_plan} at $${offerDetails.monthly_cost}/month.`,
            details: offerDetails,
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
          aip_version: '0.1.0',
          session_id: null,
          status: 'error',
          error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' }
        }));
      }
    });
    return;
  }

  // Bind: accept an offer
  if (req.method === 'POST' && req.url === '/api/aip/bind') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const request = JSON.parse(body);
        const { offer_id, session_id, bind_data } = request;

        if (!offer_id || !session_id || !bind_data) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing offer_id, session_id, or bind_data' }));
          return;
        }

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

        // In production, this would create an account, start onboarding, etc.
        activeOffers.delete(offer_id);

        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'bound',
          message: `Welcome, ${bind_data.full_name}! Your ${offer.offerDetails.recommended_plan} enrollment is confirmed.`,
          next_steps: [
            'Check your email for onboarding instructions',
            'Complete your health questionnaire',
            'Schedule your first coaching call'
          ],
          account_ref: `mvh-${Date.now()}`
        }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // 404 for everything else
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`\n  Man vs Health — AIP Example Server`);
  console.log(`  ===================================`);
  console.log(`  Server running at ${HOST}\n`);
  console.log(`  Endpoints:`);
  console.log(`    GET  ${HOST}/.well-known/agent-intake.json`);
  console.log(`    POST ${HOST}/api/aip/metabolic-assessment`);
  console.log(`    POST ${HOST}/api/aip/bind\n`);
});
