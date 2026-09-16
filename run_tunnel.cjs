const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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

console.log('\n🚀 Launching Cloudflare Tunnel for CrewLink Backend on port 5000...\n');

const child = spawn(cloudflaredExe, ['tunnel', '--url', 'http://localhost:5000'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let tunnelUrlFound = false;

const onData = (chunk) => {
  const text = chunk.toString();
  
  if (!tunnelUrlFound) {
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match) {
      tunnelUrlFound = true;
      const tunnelUrl = match[0];

      // Save to file for easy reference
      fs.writeFileSync(path.join(__dirname, 'current_tunnel_url.txt'), tunnelUrl, 'utf8');

      // Update PUBLIC_INTERNET_URL in src/services/api.js so builds stay in sync
      try {
        const apiJsPath = path.join(__dirname, 'src', 'services', 'api.js');
        if (fs.existsSync(apiJsPath)) {
          let apiContent = fs.readFileSync(apiJsPath, 'utf8');
          apiContent = apiContent.replace(/export const PUBLIC_INTERNET_URL = '[^']+';/, `export const PUBLIC_INTERNET_URL = '${tunnelUrl}';`);
          fs.writeFileSync(apiJsPath, apiContent, 'utf8');
        }
      } catch (_) {}

      // Push to GitHub repository so mobile devices auto-resolve the URL
      try {
        execSync('git add current_tunnel_url.txt && git commit -m "Auto-update tunnel URL" && git push origin main', { stdio: 'ignore' });
        console.log('📡 Published active tunnel URL to GitHub Cloud Registry for Mobile Data auto-sync!');
      } catch (err) {
        console.log('ℹ️  GitHub cloud registry push skipped or up to date.');
      }

      // Attempt clipboard copy
      try {
        execSync(`powershell -Command "Set-Clipboard -Value '${tunnelUrl}'"`, { stdio: 'ignore' });
      } catch (_) {}

      console.log('================================================================');
      console.log('🎉 CREWLINK INTERNET TUNNEL IS LIVE & READY!');
      console.log('================================================================');
      console.log(`\n🌐 Public Tunnel URL:`);
      console.log(`   👉  ${tunnelUrl}\n`);
      console.log(`📋 Copied to clipboard automatically!\n`);
      console.log('📱 HOW TO CONNECT FROM YOUR PHONE (Mobile Data / 4G / 5G):');
      console.log('1. Open the CrewLink app on your phone.');
      console.log('2. Tap the Server badge in the top-right corner (or in the red error box).');
      console.log(`3. Enter or paste this URL:`);
      console.log(`   ${tunnelUrl}`);
      console.log('4. Tap "Test Connection" (it will show a green checkmark), then tap "Save & Apply"!');
      console.log('\n📥 TO DIRECTLY DOWNLOAD THE APK TO YOUR PHONE:');
      console.log(`   Open your phone browser and visit:`);
      console.log(`   ${tunnelUrl}/download-apk`);
      console.log('\n================================================================');
      console.log('ℹ️  Keep this window open while using the app over mobile data.');
      console.log('    Press Ctrl+C to stop the tunnel.\n');
    }
  }
};

child.stdout.on('data', onData);
child.stderr.on('data', onData);

child.on('close', (code) => {
  console.log(`\nTunnel closed (exit code ${code}).`);
});

process.on('SIGINT', () => {
  child.kill();
  process.exit();
});
