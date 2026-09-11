const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  rules: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true,
    default: 'General'
  },
  subCategory: {
    type: String
  },
  date: {
    type: Date,
    required: false
  },
  time: {
    type: String
  },
  location: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: false
  },
  decorations: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  capacity: {
    type: Number,
    required: true
  },
  registeredCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  assignedVolunteers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);