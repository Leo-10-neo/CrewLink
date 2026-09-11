const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() { return !this.googleId; }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  photo: { type: String },
  aadharNo: { type: String },
  panCardNo: { type: String },
  address: { type: String },
  age: { type: Number },
  fullName: { type: String },
  gender: { type: String },
  phone: { type: String },
  city: { type: String },
  skills: { type: [String], default: [] },
  experience: { type: String },
  languages: { type: [String], default: [] },
  availability: { type: [String], default: [] },
  preferredEventTypes: { type: [String], default: [] },
  expertRole: { type: String, default: '' },
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
    relation: { type: String }
  },
  bloodGroup: { type: String },
  profileStatus: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Verified'
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'volunteer'],
    default: 'user'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);