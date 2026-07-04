const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/auth.controller");

const protect = require("../middleware/auth");
const authorize = require("../middleware/roleMiddleware");

console.log("✅ auth.routes.js loaded");

// Public Routes
router.post("/register", register);
router.post("/login", login);

// Protected Route
router.get(
    "/profile",
    protect,
    authorize("student", "coordinator", "admin"),
    (req, res) => {
        res.status(200).json({
            success: true,
            user: req.user
        });
    }
);

// Admin Route
router.get(
    "/admin",
    protect,
    authorize("admin"),
    (req, res) => {
        res.json({
            success: true,
            message: "Welcome Admin"
        });
    }
);

// Coordinator Route
router.get(
    "/coordinator",
    protect,
    authorize("coordinator"),
    (req, res) => {
        res.json({
            success: true,
            message: "Welcome Coordinator"
        });
    }
);

// Student Route
router.get(
    "/student",
    protect,
    authorize("student"),
    (req, res) => {
        res.json({
            success: true,
            message: "Welcome Student"
        });
    }
);

module.exports = router;