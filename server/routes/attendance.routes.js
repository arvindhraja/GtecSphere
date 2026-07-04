const express = require("express");

const router = express.Router();

const {
    markAttendance,
    getEventAttendance,
    updateAttendance,
    deleteAttendance,
    getMyAttendance
} = require("../controllers/attendance.controller");

const protect = require("../middleware/auth");
const authorize = require("../middleware/roleMiddleware");


// ==========================================
// GET MY ATTENDANCE HISTORY
// STUDENT ONLY
// ==========================================
router.get(
    "/my-attendance",
    protect,
    authorize("student"),
    getMyAttendance
);


// ==========================================
// MARK STUDENT ATTENDANCE
// COORDINATOR / ADMIN
// ==========================================
router.post(
    "/mark",
    protect,
    authorize("coordinator", "admin"),
    markAttendance
);


// ==========================================
// GET EVENT ATTENDANCE LIST
// COORDINATOR / ADMIN
// ==========================================
router.get(
    "/event/:eventId",
    protect,
    authorize("coordinator", "admin"),
    getEventAttendance
);


// ==========================================
// UPDATE STUDENT ATTENDANCE
// COORDINATOR / ADMIN
// ==========================================
router.patch(
    "/event/:eventId/student/:studentId",
    protect,
    authorize("coordinator", "admin"),
    updateAttendance
);


// ==========================================
// DELETE / RESET STUDENT ATTENDANCE
// COORDINATOR / ADMIN
// ==========================================
router.delete(
    "/event/:eventId/student/:studentId",
    protect,
    authorize("coordinator", "admin"),
    deleteAttendance
);



module.exports = router;