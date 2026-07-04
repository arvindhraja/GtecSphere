const express = require("express");

const router = express.Router();

const {
    getCoordinatorDashboard,
    getMyEvents,
    getEventParticipants,
    updateMyEvent,
    deleteMyEvent
} = require("../controllers/coordinator.controller");

const protect = require("../middleware/auth");
const authorize = require("../middleware/roleMiddleware");


// ==========================================
// COORDINATOR DASHBOARD
// ==========================================
router.get(
    "/dashboard",
    protect,
    authorize("coordinator"),
    getCoordinatorDashboard
);


// ==========================================
// GET MY EVENTS
// ==========================================
router.get(
    "/events",
    protect,
    authorize("coordinator"),
    getMyEvents
);


// ==========================================
// GET PARTICIPANTS OF MY EVENT
// ==========================================
router.get(
    "/events/:eventId/participants",
    protect,
    authorize("coordinator"),
    getEventParticipants
);


// ==========================================
// UPDATE MY EVENT
// ==========================================
router.patch(
    "/events/:eventId",
    protect,
    authorize("coordinator"),
    updateMyEvent
);


// ==========================================
// DELETE MY EVENT
// ==========================================
router.delete(
    "/events/:eventId",
    protect,
    authorize("coordinator"),
    deleteMyEvent
);


module.exports = router;