const express = require("express");

const router = express.Router();

const {
    getDashboardStats,
    getAllUsers,
    toggleUserStatus,
    updateUserRole
} = require("../controllers/admin.controller");

const protect = require("../middleware/auth");
const authorize = require("../middleware/roleMiddleware");


// ==========================================
// ADMIN DASHBOARD
// ==========================================
router.get(
    "/stats",
    protect,
    authorize("admin"),
    getDashboardStats
);


// ==========================================
// GET ALL USERS
// ==========================================
router.get(
    "/users",
    protect,
    authorize("admin"),
    getAllUsers
);


// ==========================================
// ACTIVATE / DEACTIVATE USER
// ==========================================
router.patch(
    "/users/:id/status",
    protect,
    authorize("admin"),
    toggleUserStatus
);


// ==========================================
// ASSIGN / EDIT USER ROLE
// ==========================================
router.patch(
    "/users/:id/role",
    protect,
    authorize("admin"),
    updateUserRole
);


module.exports = router;