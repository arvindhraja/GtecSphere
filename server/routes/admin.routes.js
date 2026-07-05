const express = require("express");

const router = express.Router();

const {
    getDashboardStats,

    getAllUsers,

    getAllStudents,
    getStudentById,

    toggleUserStatus,
    updateUserRole,

    createCoordinator,
    getAllCoordinators,
    assignCoordinatorEvents
} = require(
    "../controllers/admin.controller"
);

const protect = require("../middleware/auth");

const authorize = require(
    "../middleware/roleMiddleware"
);


// ==========================================
// ALL ADMIN ROUTES REQUIRE LOGIN + ADMIN
// ==========================================
router.use(protect);
router.use(authorize("admin"));


// ==========================================
// ADMIN DASHBOARD LIVE STATISTICS
//
// GET /api/admin/stats
// ==========================================
router.get(
    "/stats",
    getDashboardStats
);


// ==========================================
// GET ALL USERS
//
// GET /api/admin/users
// ==========================================
router.get(
    "/users",
    getAllUsers
);


// ==========================================
// GET ALL STUDENTS
//
// GET /api/admin/students
//
// OPTIONAL QUERY:
// ?search=
// ?department=
// ?year=
// ?status=active
// ==========================================
router.get(
    "/students",
    getAllStudents
);


// ==========================================
// GET SINGLE STUDENT + ACTIVITY
//
// GET /api/admin/students/:id
// ==========================================
router.get(
    "/students/:id",
    getStudentById
);


// ==========================================
// ACTIVATE / DEACTIVATE USER
//
// PATCH /api/admin/users/:id/status
// ==========================================
router.patch(
    "/users/:id/status",
    toggleUserStatus
);


// ==========================================
// ASSIGN / EDIT USER ROLE
//
// PATCH /api/admin/users/:id/role
// ==========================================
router.patch(
    "/users/:id/role",
    updateUserRole
);


// ==========================================
// GET ALL COORDINATORS
//
// GET /api/admin/coordinators
// ==========================================
router.get(
    "/coordinators",
    getAllCoordinators
);


// ==========================================
// CREATE COORDINATOR
//
// POST /api/admin/coordinators
// ==========================================
router.post(
    "/coordinators",
    createCoordinator
);


// ==========================================
// ASSIGN EVENTS TO COORDINATOR
//
// PATCH
// /api/admin/coordinators/:id/events
//
// BODY:
// {
//     "eventIds": [
//         "EVENT_ID_1",
//         "EVENT_ID_2"
//     ]
// }
// ==========================================
router.patch(
    "/coordinators/:id/events",
    assignCoordinatorEvents
);


// ==========================================
// EXPORT ROUTER
// ==========================================
module.exports = router;