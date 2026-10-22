const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Auto-seeds the database with default admin and volunteer accounts on boot.
 * Safe to call on every startup - checks before creating.
 */
const seedAdmin = async () => {
  try {
    const User = require('./models/User');
    const VolunteerProfile = require('./models/VolunteerProfile');

    // 1. Seed Admin Account
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@crewlink.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
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
      console.log(`[Seed] ✅ Admin account created: ${adminEmail} / ${adminPassword}`);
    } else {
      console.log(`[Seed] Admin account already exists: ${adminEmail}`);
    }

    // 2. Seed Default Volunteer Account
    const volEmail = process.env.VOLUNTEER_EMAIL || 'volunteer@crewlink.com';
    const volPassword = process.env.VOLUNTEER_PASSWORD || 'volunteer123';
    const volUsername = process.env.VOLUNTEER_USERNAME || 'volunteer';

    let existingVolunteer = await User.findOne({ email: volEmail });
    if (!existingVolunteer) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(volPassword, salt);

      existingVolunteer = await User.create({
        username: volUsername,
        email: volEmail,
        password: hashedPassword,
        role: 'volunteer',
        fullName: 'CrewLink Volunteer',
        profileStatus: 'Verified'
      });

      await VolunteerProfile.findOneAndUpdate(
        { user: existingVolunteer._id },
        {
          user: existingVolunteer._id,
          fullName: 'CrewLink Volunteer',
          city: 'Bangalore',
          phone: '9876543210',
          skills: 'Registration, Crowd Control, Stage Operations',
          availability: 'Weekdays, Weekends',
          experience: '2 years',
          preferredEventTypes: 'Cultural, Technical, Sports',
          expertRole: 'Event Operations Lead',
          languages: ['English', 'Kannada', 'Hindi'],
          emergencyContact: { name: 'Support', phone: '9876543210', relation: 'Admin' },
          bloodGroup: 'O+',
          applicationStatus: 'approved',
          crewPoints: 100
        },
        { upsert: true, new: true }
      );
      console.log(`[Seed] ✅ Volunteer account created: ${volEmail} / ${volPassword}`);
    } else {
      console.log(`[Seed] Volunteer account already exists: ${volEmail}`);
    }

    // 3. Also ensure test volunteer 'ani@gmail.com' exists with known password
    const aniEmail = 'ani@gmail.com';
    let aniUser = await User.findOne({ email: aniEmail });
    if (!aniUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('volunteer123', salt);
      aniUser = await User.create({
        username: 'ani',
        email: aniEmail,
        password: hashedPassword,
        role: 'volunteer',
        fullName: 'Ani K',
        profileStatus: 'Verified'
      });

      await VolunteerProfile.findOneAndUpdate(
        { user: aniUser._id },
        {
          user: aniUser._id,
          fullName: 'Ani K',
          city: 'Mandya',
          phone: '9087651234',
          skills: 'Decoration, Event Setup',
          availability: 'Weekdays',
          experience: '2 years',
          preferredEventTypes: 'Non corporate',
          expertRole: 'Decoration Team',
          languages: ['Kannada', 'Hindi'],
          emergencyContact: { name: 'Pari', phone: '9087651234', relation: 'Friend' },
          bloodGroup: 'B+',
          applicationStatus: 'approved',
          crewPoints: 500
        },
        { upsert: true, new: true }
      );
      console.log(`[Seed] ✅ Test volunteer created: ${aniEmail} / volunteer123`);
    }

  } catch (err) {
    console.error('[Seed] Failed to seed accounts:', err.message);
  }
};

module.exports = { seedAdmin };
