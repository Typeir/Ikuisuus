const fs = require('fs');
const path = require('path');
const https = require('https');

const REPO_OWNER = 'Typeir'; // Replace with your repo owner
const REPO_NAME = 'ikuisuus-content'; // Replace with your repo name

function parseEnvFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
    return env;
  } catch (err) {
    return null;
  }
}

const envPath = path.resolve(__dirname, '..', '.env.local');
const envFromFile = parseEnvFile(envPath);
const GITHUB_PAT = process.env.GITHUB_PAT || (envFromFile && envFromFile.GITHUB_PAT) || null;

if (!GITHUB_PAT) {
  console.error('Error: GITHUB_PAT not found in environment or .env.local');
  process.exit(1);
}

console.log('Using GITHUB_PAT from', process.env.GITHUB_PAT ? 'process.env' : envFromFile ? envPath : 'unknown');

const options = {
  hostname: 'api.github.com',
  path: `/repos/${REPO_OWNER}/${REPO_NAME}`,
  method: 'GET',
  headers: {
    'User-Agent': 'ikuisuus-cli',
    Authorization: `Bearer ${GITHUB_PAT}`,
    Accept: 'application/vnd.github+json',
  },
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('Repository details fetched successfully');
        console.log(`Name: ${parsed.full_name}`);
        console.log(`Private: ${parsed.private}`);
        console.log(`Default branch: ${parsed.default_branch}`);

        // Check PAT scopes from response headers
        const scopesHeader = res.headers['x-oauth-scopes'] || '';
        const acceptedHeader = res.headers['x-accepted-oauth-scopes'] || '';
        console.log('PAT scopes header:', scopesHeader || '(none)');
        if (acceptedHeader) console.log('Accepted scopes for endpoint:', acceptedHeader);

        const scopes = scopesHeader.split(',').map((s) => s.trim()).filter(Boolean);
        const needsRepoScope = parsed.private === true;
        const hasRepo = scopes.includes('repo');
        const hasPublicRepo = scopes.includes('public_repo');

        if (needsRepoScope) {
          if (!hasRepo) {
            console.error('\nERROR: This repository is private but the token does not include the `repo` scope.');
            console.error('Regenerate the PAT with the `repo` scope (or use a token with org SSO approved access).');
            process.exit(2);
          }
        } else {
          if (!hasRepo && !hasPublicRepo) {
            console.error('\nERROR: Repository is public but the token lacks `repo` or `public_repo` scope.');
            console.error('Regenerate the PAT with `public_repo`, or `repo` for full access.');
            process.exit(2);
          }
        }

        console.log('\nPAT scope check passed — token has the necessary scopes.');
      } else {
        console.error(`Error: ${res.statusCode} ${res.statusMessage}`);
        console.error('Body:', parsed);
        process.exit(1);
      }
    } catch (err) {
      console.error('Failed to parse response:', err.message);
      console.error('Raw body:', body);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('Request failed:', e.message);
  process.exit(1);
});

req.end();