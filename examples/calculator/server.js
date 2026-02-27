const http = require('node:http');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');

const PORT = process.env.PORT || 3002;
const HOST = `http://localhost:${PORT}`;

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'agent-intake.json'), 'utf8')
);
manifest.intakes[0].endpoint = `${HOST}/api/aip/bmi`;

function calculateBMI(heightInches, weightLbs) {
  // BMI = (weight in lbs * 703) / (height in inches)^2
  const bmi = (weightLbs * 703) / (heightInches * heightInches);
  return Math.round(bmi * 10) / 10;
}

function getBMICategory(bmi) {
  if (bmi < 18.5) return { category: 'Underweight', risk: 'Increased health risk' };
  if (bmi < 25) return { category: 'Normal weight', risk: 'Low health risk' };
  if (bmi < 30) return { category: 'Overweight', risk: 'Moderate health risk' };
  if (bmi < 35) return { category: 'Obese (Class I)', risk: 'High health risk' };
  if (bmi < 40) return { category: 'Obese (Class II)', risk: 'Very high health risk' };
  return { category: 'Obese (Class III)', risk: 'Extremely high health risk' };
}

function getHealthyWeightRange(heightInches) {
  // Healthy BMI: 18.5 - 24.9
  const minWeight = Math.round((18.5 * heightInches * heightInches) / 703);
  const maxWeight = Math.round((24.9 * heightInches * heightInches) / 703);
  return { min_lbs: minWeight, max_lbs: maxWeight };
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

  if (req.method === 'POST' && req.url === '/api/aip/bmi') {
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

        const { height_inches, weight_lbs } = intake_data;

        if (!height_inches || !weight_lbs) {
          res.writeHead(400);
          res.end(JSON.stringify({
            aip_version: '0.1.0', session_id,
            status: 'error',
            error: { code: 'SCHEMA_MISMATCH', message: 'Missing required fields: height_inches, weight_lbs' }
          }));
          return;
        }

        const bmi = calculateBMI(height_inches, weight_lbs);
        const { category, risk } = getBMICategory(bmi);
        const healthyRange = getHealthyWeightRange(height_inches);

        const response = {
          aip_version: '0.1.0',
          session_id,
          status: 'offer',
          offer: {
            id: crypto.randomUUID(),
            summary: `BMI: ${bmi} — ${category}. ${risk}. Healthy weight range for your height: ${healthyRange.min_lbs}-${healthyRange.max_lbs} lbs.`,
            details: {
              bmi,
              category,
              risk_level: risk,
              height_inches,
              weight_lbs,
              healthy_weight_range: healthyRange,
              formula: 'BMI = (weight_lbs × 703) / height_inches²',
              disclaimer: 'BMI is a screening tool, not a diagnostic measure. It does not account for muscle mass, bone density, or body composition. Consult a healthcare provider for personalized advice.'
            }
          }
        };

        // No bind_endpoint or bind_requires — this is non-binding
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

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`\n  HealthCalc — AIP Calculator Example`);
  console.log(`  ====================================`);
  console.log(`  Server running at ${HOST}\n`);
  console.log(`  Endpoints:`);
  console.log(`    GET  ${HOST}/.well-known/agent-intake.json`);
  console.log(`    POST ${HOST}/api/aip/bmi\n`);
  console.log(`  Note: This is a non-binding intake — no bind endpoint.\n`);
});
