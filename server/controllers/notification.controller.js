const Notification = require("../models/NotificationModel");


// ==========================================
// GET MY NOTIFICATIONS
// LOGGED-IN USER
// ==========================================
const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            user: req.user._id
        })
            .populate(
                "relatedEvent",
                "title category venue date time status"
            )
            .sort({
                createdAt: -1
            });

        const unreadCount = await Notification.countDocuments({
            user: req.user._id,
            isRead: false
        });

        return res.status(200).json({
            success: true,

            summary: {
                totalNotifications: notifications.length,
                unread: unreadCount,
                read: notifications.length - unreadCount
            },

            notifications
        });

    } catch (error) {
        console.error(
            "GET MY NOTIFICATIONS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// MARK ONE NOTIFICATION AS READ
// LOGGED-IN USER
// ==========================================
const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findOne({
            _id: notificationId,
            user: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message:
                    "Notification not found or you are not authorized"
            });
        }

        if (notification.isRead) {
            return res.status(400).json({
                success: false,
                message:
                    "Notification is already marked as read"
            });
        }

        notification.isRead = true;
        notification.readAt = new Date();

        await notification.save();

        await notification.populate(
            "relatedEvent",
            "title category venue date time status"
        );

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        console.error(
            "MARK NOTIFICATION AS READ ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// LOGGED-IN USER
// ==========================================
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            {
                user: req.user._id,
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",

            summary: {
                updatedNotifications: result.modifiedCount
            }
        });

    } catch (error) {
        console.error(
            "MARK ALL NOTIFICATIONS AS READ ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================
module.exports = {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};