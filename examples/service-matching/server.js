const http = require('node:http');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');

const PORT = process.env.PORT || 3001;
const HOST = `http://localhost:${PORT}`;

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'agent-intake.json'), 'utf8')
);
manifest.intakes[0].endpoint = `${HOST}/api/aip/service-request`;

// Simulated provider database
const PROVIDERS = {
  plumbing: [
    { name: 'Metro Plumbing Co.', rating: 4.8, reviews: 234, years_exp: 15, hourly_rate: 85 },
    { name: 'QuickFix Plumbers', rating: 4.6, reviews: 167, years_exp: 8, hourly_rate: 75 },
    { name: 'Elite Pipe Services', rating: 4.9, reviews: 312, years_exp: 22, hourly_rate: 110 }
  ],
  electrical: [
    { name: 'Spark Electric', rating: 4.7, reviews: 189, years_exp: 12, hourly_rate: 95 },
    { name: 'BrightWire Electrical', rating: 4.5, reviews: 98, years_exp: 6, hourly_rate: 80 }
  ],
  cleaning: [
    { name: 'Spotless Home Services', rating: 4.9, reviews: 456, years_exp: 10, hourly_rate: 45 },
    { name: 'Fresh & Clean Co.', rating: 4.7, reviews: 278, years_exp: 7, hourly_rate: 40 },
    { name: 'ProClean Team', rating: 4.4, reviews: 123, years_exp: 4, hourly_rate: 35 }
  ],
  landscaping: [
    { name: 'Green Thumb Landscapes', rating: 4.8, reviews: 201, years_exp: 18, hourly_rate: 65 },
    { name: 'Nature\'s Best Landscaping', rating: 4.6, reviews: 145, years_exp: 9, hourly_rate: 55 }
  ],
  painting: [
    { name: 'ColorPro Painters', rating: 4.7, reviews: 178, years_exp: 14, hourly_rate: 60 },
    { name: 'Fresh Coat Painting', rating: 4.5, reviews: 112, years_exp: 5, hourly_rate: 50 }
  ]
};

// Fallback providers for service types not in the database
const DEFAULT_PROVIDERS = [
  { name: 'Trusted Local Services', rating: 4.5, reviews: 89, years_exp: 5, hourly_rate: 70 },
  { name: 'HomeRight Pros', rating: 4.3, reviews: 56, years_exp: 3, hourly_rate: 60 }
];

const activeOffers = new Map();

function matchProviders(intakeData) {
  const { service_type, urgency, budget_range } = intakeData;
  let providers = PROVIDERS[service_type] || DEFAULT_PROVIDERS;

  // Sort by relevance — emergency jobs prioritize higher-rated, more experienced
  if (urgency === 'emergency') {
    providers = [...providers].sort((a, b) => b.rating - a.rating);
  }

  return providers.map(p => ({
    provider_name: p.name,
    rating: p.rating,
    total_reviews: p.reviews,
    years_experience: p.years_exp,
    estimated_hourly_rate: p.hourly_rate,
    availability: urgency === 'emergency' ? 'Same day' : 'Within 3 business days',
    badge: p.rating >= 4.8 ? 'Top Rated' : p.years_exp >= 10 ? 'Experienced' : null
  }));
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

  if (req.method === 'POST' && req.url === '/api/aip/service-request') {
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

        if (!intake_data.service_type || !intake_data.zip_code) {
          res.writeHead(400);
          res.end(JSON.stringify({
            aip_version: '0.1.0', session_id,
            status: 'error',
            error: { code: 'SCHEMA_MISMATCH', message: 'Missing required fields: service_type, zip_code' }
          }));
          return;
        }

        const matched = matchProviders(intake_data);
        const offerId = crypto.randomUUID();
        const expires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

        activeOffers.set(offerId, { session_id, intake_data, matched, expires });

        const response = {
          aip_version: '0.1.0',
          session_id,
          status: 'offer',
          offer: {
            id: offerId,
            summary: `We found ${matched.length} ${intake_data.service_type} providers near ${intake_data.zip_code}. Top match: ${matched[0].provider_name} (${matched[0].rating} stars, ${matched[0].total_reviews} reviews).`,
            details: {
              matched_providers: matched,
              service_type: intake_data.service_type,
              area: intake_data.zip_code,
              total_matches: matched.length
            },
            expires,
            bind_endpoint: `${HOST}/api/aip/bind`,
            bind_requires: ['email', 'full_name', 'phone']
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

        if (!bind_data.email || !bind_data.full_name || !bind_data.phone) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Bind requires email, full_name, and phone' }));
          return;
        }

        activeOffers.delete(offer_id);

        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'bound',
          message: `Thanks, ${bind_data.full_name}! We're connecting you with ${offer.matched[0].provider_name}. They'll reach out within 2 hours.`,
          booking_ref: `wd-${Date.now()}`,
          matched_provider: offer.matched[0].provider_name
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
  console.log(`\n  WhoDo — AIP Service Matching Example`);
  console.log(`  =====================================`);
  console.log(`  Server running at ${HOST}\n`);
  console.log(`  Endpoints:`);
  console.log(`    GET  ${HOST}/.well-known/agent-intake.json`);
  console.log(`    POST ${HOST}/api/aip/service-request`);
  console.log(`    POST ${HOST}/api/aip/bind\n`);
});
