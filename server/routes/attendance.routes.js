const express = require("express");

const router = express.Router();

const {
    markAttendance,
    getEventAttendance,
    updateAttendance,
    deleteAttendance,
    markAllPresent,
    resetAllAttendance,
    getMyAttendance
} = require(
    "../controllers/attendance.controller"
);

const protect = require(
    "../middleware/auth"
);

const authorize = require(
    "../middleware/roleMiddleware"
);


// ==========================================
// ALL ROUTES REQUIRE LOGIN
// ==========================================
router.use(protect);


// ==========================================
// GET MY ATTENDANCE HISTORY
// STUDENT ONLY
//
// GET /api/attendance/my-attendance
// ==========================================
router.get(
    "/my-attendance",
    authorize("student"),
    getMyAttendance
);


// ==========================================
// MARK ONE STUDENT ATTENDANCE
// ADMIN + COORDINATOR
//
// POST /api/attendance/mark
//
// BODY:
// {
//     "eventId": "EVENT_ID",
//     "studentId": "STUDENT_ID",
//     "status": "Present"
// }
// ==========================================
router.post(
    "/mark",
    authorize("admin", "coordinator"),
    markAttendance
);


// ==========================================
// MARK ALL REGISTERED STUDENTS PRESENT
// ADMIN + COORDINATOR
//
// POST
// /api/attendance/event/:eventId/mark-all-present
// ==========================================
router.post(
    "/event/:eventId/mark-all-present",
    authorize("admin", "coordinator"),
    markAllPresent
);


// ==========================================
// RESET ALL ATTENDANCE FOR EVENT
// ADMIN + COORDINATOR
//
// DELETE
// /api/attendance/event/:eventId/reset-all
// ==========================================
router.delete(
    "/event/:eventId/reset-all",
    authorize("admin", "coordinator"),
    resetAllAttendance
);


// ==========================================
// GET EVENT ATTENDANCE LIST
// ADMIN + COORDINATOR
//
// GET /api/attendance/event/:eventId
// ==========================================
router.get(
    "/event/:eventId",
    authorize("admin", "coordinator"),
    getEventAttendance
);


// ==========================================
// UPDATE OR CREATE ONE STUDENT ATTENDANCE
// ADMIN + COORDINATOR
//
// PATCH
// /api/attendance/event/:eventId/student/:studentId
//
// BODY:
// {
//     "status": "Present"
// }
// ==========================================
router.patch(
    "/event/:eventId/student/:studentId",
    authorize("admin", "coordinator"),
    updateAttendance
);


// ==========================================
// RESET ONE STUDENT ATTENDANCE
// ADMIN + COORDINATOR
//
// DELETE
// /api/attendance/event/:eventId/student/:studentId
// ==========================================
router.delete(
    "/event/:eventId/student/:studentId",
    authorize("admin", "coordinator"),
    deleteAttendance
);


// ==========================================
// EXPORT ROUTER
// ==========================================
module.exports = router;