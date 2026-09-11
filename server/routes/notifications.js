const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { adminAuth, auth } = require('../middleware/auth');

// Helper to filter notifications for a user/admin
const getNotificationFilter = (user) => {
  if (user.role === 'admin') {
    return {
      $or: [
        { userId: user._id },
        { userId: { $exists: false } },
        { userId: null }
      ]
    };
  }
  return { userId: user._id };
};

// GET all notifications for admin
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const filter = getNotificationFilter(req.user);
    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET notifications for logged-in user (volunteer or admin)
router.get('/', auth, async (req, res) => {
  try {
    const filter = getNotificationFilter(req.user);
    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT mark all as read
router.put('/read-all', auth, async (req, res) => {
  try {
    const filter = getNotificationFilter(req.user);
    const result = await Notification.updateMany({ ...filter, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read', modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE clear all notifications
router.delete('/clear-all', auth, async (req, res) => {
  try {
    const filter = getNotificationFilter(req.user);
    const result = await Notification.deleteMany(filter);
    console.log('Cleared notifications for', req.user.username, 'Count:', result.deletedCount);
    res.json({ message: 'All notifications cleared', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, userId: req.user._id };
    const notification = await Notification.findOneAndUpdate(
      filter,
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

