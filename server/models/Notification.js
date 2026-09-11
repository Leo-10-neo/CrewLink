const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  message: { type: String, required: true },
  type: { type: String, default: 'info' }, // e.g., 'task_completed', 'chat_message'
  read: { type: Boolean, default: false },
  link: { type: String }, // e.g., to the task or volunteer
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'VolunteerTask' }, // For chat notifications
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
