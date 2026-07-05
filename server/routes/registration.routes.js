const express = require("express");

const router = express.Router();

const {
    registerForEvent,
    getMyRegistrations,
    getMyRegistrationById,
    getAllRegistrations,

    getEventRegistrationsForSeats,
    assignSeat,
    clearEventSeats,

    cancelRegistration,

    updateRegistrationStatus,
    deleteRegistration
} = require(
    "../controllers/registration.controller"
);

const protect = require("../middleware/auth");

const authorize = require(
    "../middleware/roleMiddleware"
);


// ==========================================
// ALL ROUTES BELOW REQUIRE LOGIN
// ==========================================
router.use(protect);


// ==========================================
// GET ALL REGISTRATIONS
// ADMIN + COORDINATOR
//
// GET /api/registrations/all
// ==========================================
router.get(
    "/all",
    authorize("admin", "coordinator"),
    getAllRegistrations
);


// ==========================================
// GET REGISTRATIONS FOR ONE EVENT
// SEAT MANAGEMENT
// ADMIN + COORDINATOR
//
// GET /api/registrations/seats/:eventId
// ==========================================
router.get(
    "/seats/:eventId",
    authorize("admin", "coordinator"),
    getEventRegistrationsForSeats
);


// ==========================================
// ASSIGN OR UPDATE ONE STUDENT SEAT
// ADMIN + COORDINATOR
//
// PUT /api/registrations/seats/:registrationId
// ==========================================
router.put(
    "/seats/:registrationId",
    authorize("admin", "coordinator"),
    assignSeat
);


// ==========================================
// CLEAR ALL SEATS FOR ONE EVENT
// ADMIN + COORDINATOR
//
// PUT /api/registrations/seats/event/:eventId/clear
// ==========================================
router.put(
    "/seats/event/:eventId/clear",
    authorize("admin", "coordinator"),
    clearEventSeats
);


// ==========================================
// UPDATE REGISTRATION STATUS
// ADMIN + COORDINATOR
//
// PATCH /api/registrations/:registrationId/status
// ==========================================
router.patch(
    "/:registrationId/status",
    authorize("admin", "coordinator"),
    updateRegistrationStatus
);


// ==========================================
// DELETE REGISTRATION PERMANENTLY
// ADMIN ONLY
//
// DELETE /api/registrations/admin/:registrationId
// ==========================================
router.delete(
    "/admin/:registrationId",
    authorize("admin"),
    deleteRegistration
);


// ==========================================
// GET MY REGISTRATIONS
// STUDENT ONLY
//
// GET /api/registrations/my
// ==========================================
router.get(
    "/my",
    authorize("student"),
    getMyRegistrations
);


// ==========================================
// GET ONE OF MY REGISTRATIONS
// STUDENT OWNER ONLY
//
// GET /api/registrations/my/:registrationId
// ==========================================
router.get(
    "/my/:registrationId",
    authorize("student"),
    getMyRegistrationById
);


// ==========================================
// REGISTER FOR EVENT
// STUDENT ONLY
//
// POST /api/registrations/:eventId
// ==========================================
router.post(
    "/:eventId",
    authorize("student"),
    registerForEvent
);


// ==========================================
// CANCEL MY EVENT REGISTRATION
// STUDENT ONLY
//
// DELETE /api/registrations/:eventId
// ==========================================
router.delete(
    "/:eventId",
    authorize("student"),
    cancelRegistration
);


// ==========================================
// EXPORT ROUTER
// ==========================================
module.exports = router;