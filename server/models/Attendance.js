const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VolunteerTask'
  },
  status: {
    type: String,
    enum: ['pending', 'present', 'absent'],
    default: 'pending'
  },
  checkIn: { type: Date, default: null },
  checkOut: { type: Date, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('Attendance', attendanceSchema);
