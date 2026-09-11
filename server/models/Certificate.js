const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  certificateId: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedAt: { type: Date },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  issuedDate: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificate', certificateSchema);
