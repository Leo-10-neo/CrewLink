const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
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
  const apkPath = path.join(__dirname, '../CrewLink-debug.apk');
  res.download(apkPath, 'CrewLink.apk', (err) => {
    if (err) {
      console.error('APK download error:', err);
      if (!res.headersSent) {
        res.status(404).send('APK file not found. Please build it first.');
      }
    }
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// SPA fallback: Serve frontend index.html for all other web routes, or API status if dist not present
app.get('*', (req, res) => {
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});