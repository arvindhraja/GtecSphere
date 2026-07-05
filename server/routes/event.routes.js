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


// GET ALL EVENTS
router.get("/", getEvents);


// GET SINGLE EVENT
router.get("/:id", getEvent);


// CREATE EVENT
// ADMIN + COORDINATOR
router.post(
    "/",
    protect,
    authorize("admin", "coordinator"),
    createEvent
);


// UPDATE EVENT
// ADMIN + COORDINATOR
router.put(
    "/:id",
    protect,
    authorize("admin", "coordinator"),
    updateEvent
);


// DELETE EVENT
// ADMIN + COORDINATOR
router.delete(
    "/:id",
    protect,
    authorize("admin", "coordinator"),
    deleteEvent
);


module.exports = router;