const express = require("express");

const router = express.Router();

const {
    createEvent,
    getEvents,
    getEvent,
    updateEvent,
    deleteEvent
} = require("../controllers/event.controller");

const protect = require("../middleware/auth");
const authorize = require("../middleware/roleMiddleware");

// ==========================================
// GET ALL EVENTS
// Public access
// ==========================================
router.get("/", getEvents);


// ==========================================
// GET SINGLE EVENT
// Public access
// ==========================================
router.get("/:id", getEvent);


// ==========================================
// CREATE EVENT
// Coordinator + Admin only
// ==========================================
router.post(
    "/",
    protect,
    authorize("coordinator", "admin"),
    createEvent
);


// ==========================================
// UPDATE EVENT
// Admin only
// ==========================================
router.put(
    "/:id",
    protect,
    authorize("admin"),
    updateEvent
);


// ==========================================
// DELETE EVENT
// Admin only
// ==========================================
router.delete(
    "/:id",
    protect,
    authorize("admin"),
    deleteEvent
);


module.exports = router;