const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

const cloudflaredExe = path.join(__dirname, 'cloudflared.exe');

// Ensure cloudflared binary exists
if (!fs.existsSync(cloudflaredExe)) {
  console.log('⬇️  cloudflared.exe not found locally. Downloading official binary...');
  try {
    execSync(`curl.exe -L -s -o "${cloudflaredExe}" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe`, { stdio: 'inherit' });
    console.log('✅ cloudflared.exe downloaded successfully.');
  } catch (err) {
    console.error('❌ Failed to download cloudflared:', err.message);
    process.exit(1);
  }
}

let child = null;
let currentTunnelUrl = '';
let consecutiveFailures = 0;
let isRestarting = false;

function pingUrl(urlStr) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const req = https.get(parsed, { timeout: 8000 }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    } catch (_) {
      resolve(false);
    }
  });
}

function startTunnel() {
  if (isRestarting) return;
  isRestarting = true;

  if (child) {
    try {
      child.kill();
    } catch (_) {}
    child = null;
  }

  console.log('\n🚀 Starting Cloudflare Tunnel Watchdog for port 5000...');
  let tunnelUrlFound = false;

  child = spawn(cloudflaredExe, ['tunnel', '--url', 'http://localhost:5000'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const onData = (chunk) => {
    const text = chunk.toString();

    if (!tunnelUrlFound) {
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (match && !match[0].includes('api.trycloudflare.com')) {
        tunnelUrlFound = true;
        isRestarting = false;
        consecutiveFailures = 0;
        currentTunnelUrl = match[0];

        console.log('================================================================');
        console.log('🎉 CREWLINK TUNNEL ONLINE & LIVE!');
        console.log('================================================================');
        console.log(`🌐 URL: 👉  ${currentTunnelUrl}\n`);

        // 1. Save locally
        fs.writeFileSync(path.join(__dirname, 'current_tunnel_url.txt'), currentTunnelUrl, 'utf8');

        // 2. Update api.js
        try {
          const apiJsPath = path.join(__dirname, 'src', 'services', 'api.js');
          if (fs.existsSync(apiJsPath)) {
            let apiContent = fs.readFileSync(apiJsPath, 'utf8');
            apiContent = apiContent.replace(/export const PUBLIC_INTERNET_URL = '[^']+';/, `export const PUBLIC_INTERNET_URL = '${currentTunnelUrl}';`);
            fs.writeFileSync(apiJsPath, apiContent, 'utf8');
          }
        } catch (_) {}

        // 3. Auto-publish to GitHub Cloud Registry so mobile devices auto-sync
        try {
          execSync('git add current_tunnel_url.txt && git commit -m "Auto-update tunnel URL" && git push origin main', { stdio: 'ignore' });
          console.log('📡 Published active tunnel URL to GitHub Cloud Registry!');
        } catch (err) {
          console.log('ℹ️  GitHub cloud registry push skipped or up to date.');
        }

        // 4. Clipboard copy
        try {
          execSync(`powershell -Command "Set-Clipboard -Value '${currentTunnelUrl}'"`, { stdio: 'ignore' });
        } catch (_) {}
      }
    }
  };

  child.stdout.on('data', onData);
  child.stderr.on('data', onData);

  child.on('close', (code) => {
    console.warn(`⚠️ Tunnel process exited (code ${code}). Auto-restarting in 2 seconds...`);
    isRestarting = false;
    setTimeout(startTunnel, 2000);
  });

  child.on('error', (err) => {
    console.error(`❌ Tunnel process error:`, err.message);
    isRestarting = false;
    setTimeout(startTunnel, 3000);
  });
}

// Active Health Monitor: Every 40 seconds, check tunnel
setInterval(async () => {
  if (!currentTunnelUrl || isRestarting) return;

  const isAlive = await pingUrl(`${currentTunnelUrl}/api/test`);
  if (isAlive) {
    consecutiveFailures = 0;
  } else {
    consecutiveFailures++;
    console.warn(`⚠️ Tunnel health check failed (${consecutiveFailures}/4)...`);
    // Require 4 consecutive failures (>2.5 minutes) before concluding tunnel is dead
    if (consecutiveFailures >= 4) {
      console.warn('🔄 Tunnel unresponsive for >2.5 minutes. Restarting tunnel now...');
      consecutiveFailures = 0;
      startTunnel();
    }
  }
}, 40000);

// Start on launch
startTunnel();

process.on('SIGINT', () => {
  if (child) child.kill();
  process.exit();
});
