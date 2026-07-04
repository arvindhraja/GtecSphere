const express = require("express");

const router = express.Router();

const {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require("../controllers/notification.controller");

const protect = require("../middleware/auth");


// ==========================================
// GET MY NOTIFICATIONS
// ALL LOGGED-IN USERS
// ==========================================
router.get(
    "/my-notifications",
    protect,
    getMyNotifications
);


// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// LOGGED-IN USER
// KEEP BEFORE /:notificationId/read
// ==========================================
router.patch(
    "/read-all",
    protect,
    markAllNotificationsAsRead
);


// ==========================================
// MARK ONE NOTIFICATION AS READ
// LOGGED-IN USER
// ==========================================
router.patch(
    "/:notificationId/read",
    protect,
    markNotificationAsRead
);


module.exports = router;