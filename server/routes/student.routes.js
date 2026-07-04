const express = require("express");

const router = express.Router();

const {
    getAllEventsForStudent,
    getSingleEventForStudent,
    addFavoriteEvent,
    getFavoriteEvents,
    removeFavoriteEvent,
    getStudentDashboard,
    updateProfile
} = require("../controllers/student.controller");

const protect = require("../middleware/auth");
const authorize = require("../middleware/roleMiddleware");


// ==========================================
// GET STUDENT DASHBOARD
// ==========================================
router.get(
    "/dashboard",
    protect,
    authorize("student"),
    getStudentDashboard
);


// ==========================================
// UPDATE STUDENT PROFILE
// ==========================================
router.patch(
    "/profile",
    protect,
    authorize("student"),
    updateProfile
);


// ==========================================
// GET ALL EVENTS
// SEARCH + FILTER
// ==========================================
router.get(
    "/events",
    protect,
    authorize("student"),
    getAllEventsForStudent
);


// ==========================================
// GET SINGLE EVENT DETAILS
// ==========================================
router.get(
    "/events/:eventId",
    protect,
    authorize("student"),
    getSingleEventForStudent
);


// ==========================================
// ADD EVENT TO FAVORITES
// ==========================================
router.post(
    "/favorites/:eventId",
    protect,
    authorize("student"),
    addFavoriteEvent
);


// ==========================================
// GET MY FAVORITE EVENTS
// ==========================================
router.get(
    "/favorites",
    protect,
    authorize("student"),
    getFavoriteEvents
);


// ==========================================
// REMOVE EVENT FROM FAVORITES
// ==========================================
router.delete(
    "/favorites/:eventId",
    protect,
    authorize("student"),
    removeFavoriteEvent
);


module.exports = router;