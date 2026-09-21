const mongoose = require('mongoose');

const volunteerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fullName: { type: String, default: '' },
  city: { type: String, default: '' },
  phone: { type: String, default: '' },
  upiId: { type: String, default: '' },
  photo: { type: String, default: '' },
  aadharNo: { type: String, default: '' },
  panCardNo: { type: String, default: '' },
  address: { type: String, default: '' },
  age: { type: Number, default: null },
  gender: { type: String, default: '' },
  skills: { type: String, default: '' },
  availability: { type: String, default: '' },
  experience: { type: String, default: '' },
  preferredEventTypes: { type: String, default: '' },
  expertRole: { type: String, default: '' },
  languages: { type: [String], default: [] },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relation: { type: String, default: '' }
  },
  bloodGroup: { type: String, default: '' },
  applicationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  crewPoints: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('VolunteerProfile', volunteerProfileSchema);
