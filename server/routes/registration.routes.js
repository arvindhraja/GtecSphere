const express = require("express");

const router = express.Router();

const {
    registerForEvent,
    getMyRegistrations,
    cancelRegistration
} = require("../controllers/registration.controller");

const protect = require("../middleware/auth");
const authorize = require("../middleware/roleMiddleware");

// Register for an event
router.post(
    "/:eventId",
    protect,
    authorize("student"),
    registerForEvent
);

// Get my registered events
router.get(
    "/my-events",
    protect,
    authorize("student"),
    getMyRegistrations
);

// Cancel event registration
router.delete(
    "/:eventId",
    protect,
    authorize("student"),
    cancelRegistration
);

module.exports = router;