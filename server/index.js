const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

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

const path = require('path');

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

// Root & Test routes
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'CrewLink API Server is live' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});