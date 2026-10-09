const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/event-management';
const { seedAdmin } = require('./seed');

mongoose.connect(MONGODB_URI)
  .then(async () => {
    const sanitizedUri = MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
    console.log(`MongoDB connected successfully to ${sanitizedUri}`);
    // Auto-create admin account if it doesn't exist (needed for fresh cloud DB)
    await seedAdmin();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
console.log('Setting up routes...');
const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const usersRoutes = require('./routes/users');
const volunteerRoutes = require('./routes/volunteer');
const certificatesRoutes = require('./routes/certificates');
const notificationsRoutes = require('./routes/notifications');

console.log('Auth routes:', authRoutes);
console.log('Events routes:', eventsRoutes);
console.log('Users routes:', usersRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/admin/certificates', certificatesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin/notifications', notificationsRoutes);
console.log('Routes configured');

const fs = require('fs');

// Serve static frontend assets if dist exists
const clientDistPath = path.join(__dirname, '../dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Direct APK Download route for mobile devices
app.get('/download-apk', (req, res) => {
  const candidatePaths = [
    path.join(__dirname, '../CrewLink-debug.apk'),
    path.join(__dirname, '../CrewLink.apk'),
    path.join(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk'),
  ];

  const apkPath = candidatePaths.find(p => fs.existsSync(p));
  if (!apkPath) {
    return res.status(404).send('APK file not found. Please build the Android app first.');
  }

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.download(apkPath, 'CrewLink.apk', (err) => {
    if (err && !res.headersSent) {
      console.error('APK download error:', err);
      res.status(500).send('Error serving APK file.');
    }
  });
});

// Download and view QA Test Execution Reports
app.get('/download-report', (req, res) => {
  const pdfPath = path.join(__dirname, '../CrewLink_Selenium_Test_Report.pdf');
  if (fs.existsSync(pdfPath)) {
    res.setHeader('Content-Type', 'application/pdf');
    return res.download(pdfPath, 'CrewLink_Selenium_Test_Report.pdf');
  }
  res.status(404).send('PDF Report not found.');
});

app.get('/test-report', (req, res) => {
  const htmlPath = path.join(__dirname, '../CrewLink_Selenium_Test_Report.html');
  if (fs.existsSync(htmlPath)) {
    return res.sendFile(htmlPath);
  }
  res.status(404).send('HTML Report not found.');
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// ── TEST CLEANUP ENDPOINT ────────────────────────────────────────────────────
// Deletes test volunteer accounts used by Selenium IDE / TestCase Studio so
// that tests can be re-run without "User already exists" errors.
// Only removes users whose email matches test patterns (bob*, pari*, sel_test*).
app.post('/api/test/cleanup', async (req, res) => {
  try {
    const User = require('./models/User');
    const VolunteerProfile = require('./models/VolunteerProfile');
    const testEmailPattern = /^(bob|pari|sel_test|testuser|seleniumtest)/i;
    const deleted = await User.deleteMany({
      $or: [
        { email: testEmailPattern },
        { username: testEmailPattern }
      ]
    });
    // Also clean orphaned volunteer profiles for deleted users
    await VolunteerProfile.deleteMany({
      user: { $exists: false }
    });

    // Ensure at least one certificate is in 'pending' status so Admin Certificate approval tests can re-run indefinitely
    const Certificate = require('./models/Certificate');
    const pendingCert = await Certificate.findOne({ status: 'pending' });
    if (!pendingCert) {
      const anyCert = await Certificate.findOne({ certificateId: 'CL-2026-WREC' }) || await Certificate.findOne({});
      if (anyCert) {
        await Certificate.updateOne({ _id: anyCert._id }, { $set: { status: 'pending', approvedAt: null, approvedBy: null } });
        console.log(`[TEST CLEANUP] Reset certificate ${anyCert.certificateId} to pending status`);
      }
    }

    // Ensure at least one task is in 'pending' status so Task Desk STATUS column shows Pending
    const VolunteerTask = require('./models/VolunteerTask');
    const pendingTask = await VolunteerTask.findOne({ status: 'pending' });
    if (!pendingTask) {
      const anyTask = await VolunteerTask.findOne({});
      if (anyTask) {
        await VolunteerTask.updateOne({ _id: anyTask._id }, { $set: { status: 'pending' } });
        console.log(`[TEST CLEANUP] Reset task ${anyTask.taskName} to pending status`);
      }
    }

    console.log(`[TEST CLEANUP] Removed ${deleted.deletedCount} test user(s)`);
    res.json({ success: true, deletedCount: deleted.deletedCount });
  } catch (err) {
    console.error('[TEST CLEANUP] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// SPA fallback: Serve frontend index.html for all other web routes, or API status if dist not present
app.use((req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/download-apk')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  res.json({
    status: 'ok',
    message: 'CrewLink API Server is running successfully!',
    notice: 'To view the frontend website, deploy the frontend static site on Render or configure the build command to build the frontend.',
    endpoints: {
      test: '/api/test',
      auth: '/api/auth',
      events: '/api/events',
      users: '/api/users',
      volunteer: '/api/volunteer'
    }
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // ── KEEP-ALIVE SELF-PING ─────────────────────────────────────────────────
  // Render free tier spins down after 15 minutes of inactivity.
  // Self-ping every 14 minutes to stay alive 24/7.
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    const selfUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    setInterval(async () => {
      try {
        const http = require('http');
        const https = require('https');
        const client = selfUrl.startsWith('https') ? https : http;
        client.get(`${selfUrl}/api/test`, (res) => {
          console.log(`[Keep-Alive] Self-ping OK: ${res.statusCode}`);
        }).on('error', (err) => {
          console.warn(`[Keep-Alive] Self-ping failed: ${err.message}`);
        });
      } catch (e) {
        console.warn('[Keep-Alive] Ping error:', e.message);
      }
    }, 14 * 60 * 1000); // every 14 minutes
    console.log('[Keep-Alive] Self-ping service started (every 14 min)');
  }
});