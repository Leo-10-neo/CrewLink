const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Auto-seeds the database with the default admin account on first boot.
 * Safe to call on every startup - checks before creating.
 */
const seedAdmin = async () => {
  try {
    const User = require('./models/User');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@crewlink.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';

    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log([Seed] Admin account already exists: );
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await User.create({
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      fullName: 'CrewLink Admin',
      profileStatus: 'Verified'
    });

    console.log([Seed] ✅ Admin account created:  / );
  } catch (err) {
    console.error('[Seed] Failed to seed admin:', err.message);
  }
};

module.exports = { seedAdmin };
