const express = require("express");

const router = express.Router();

const {
    register,
    login,
    forgotPassword,
    verifyResetOTP,
    resetPassword
} = require("../controllers/auth.controller");

const protect = require("../middleware/auth");

const authorize = require(
    "../middleware/roleMiddleware"
);

console.log("✅ auth.routes.js loaded");


// ==========================================
// PUBLIC AUTH ROUTES
// ==========================================

// REGISTER STUDENT
// POST /api/auth/register
router.post(
    "/register",
    register
);


// LOGIN USER
// POST /api/auth/login
router.post(
    "/login",
    login
);


// ==========================================
// FORGOT PASSWORD ROUTES
// PUBLIC
// ==========================================

// STEP 1:
// SEND 6-DIGIT OTP TO REGISTERED EMAIL
//
// POST /api/auth/forgot-password
//
// BODY:
// {
//     "email": "student@example.com"
// }
router.post(
    "/forgot-password",
    forgotPassword
);


// STEP 2:
// VERIFY THE 6-DIGIT OTP
//
// POST /api/auth/verify-reset-otp
//
// BODY:
// {
//     "email": "student@example.com",
//     "otp": "123456"
// }
router.post(
    "/verify-reset-otp",
    verifyResetOTP
);


// STEP 3:
// SET NEW PASSWORD
//
// POST /api/auth/reset-password
//
// BODY:
// {
//     "email": "student@example.com",
//     "newPassword": "newpassword",
//     "confirmPassword": "newpassword"
// }
router.post(
    "/reset-password",
    resetPassword
);


// ==========================================
// PROTECTED PROFILE ROUTE
// ==========================================

router.get(
    "/profile",
    protect,
    authorize(
        "student",
        "coordinator",
        "admin"
    ),
    (req, res) => {
        res.status(200).json({
            success: true,
            user: req.user
        });
    }
);


// ==========================================
// ADMIN TEST ROUTE
// ==========================================

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


// ==========================================
// COORDINATOR TEST ROUTE
// ==========================================

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


// ==========================================
// STUDENT TEST ROUTE
// ==========================================

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


// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;