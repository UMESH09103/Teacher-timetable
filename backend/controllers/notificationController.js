import { Notification } from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    const query = {
      $or: [
        { recipient: req.user._id },
        ...(req.user.teacherId ? [{ teacherId: req.user.teacherId._id || req.user.teacherId }] : [])
      ]
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const query = {
      $or: [
        { recipient: req.user._id },
        ...(req.user.teacherId ? [{ teacherId: req.user.teacherId._id || req.user.teacherId }] : [])
      ],
      isRead: false
    };

    await Notification.updateMany(query, { isRead: true });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};
