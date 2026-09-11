const mongoose = require('mongoose');

const volunteerTaskSchema = new mongoose.Schema({
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
  taskName: { type: String, required: true },
  description: { type: String, default: '' },
  rules: { type: String, default: '' },
  startTime: { type: Date },
  dueDate: { type: Date },
  salary: { 
    type: Number, 
    default: 200,
    min: [200, 'Salary must be at least ₹200']
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending_approval', 'approved'],
    default: 'unpaid'
  },
  paymentApprovedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  completedPhoto: {
    type: String,
    default: ''
  },
  chatMessages: {
    type: [{
      sender: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      senderName: {
        type: String,
        required: true
      },
      senderRole: {
        type: String,
        enum: ['volunteer', 'admin'],
        required: true
      },
      text: {
        type: String,
        default: ''
      },
      image: {
        type: String,
        default: ''
      },
      audio: {
        type: String,
        default: ''
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VolunteerTask', volunteerTaskSchema);
