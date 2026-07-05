const express = require("express");

const router = express.Router();

const {
    getEligibleStudents,
    issueCertificate,
    issueAllCertificates,
    getEventCertificates,
    getAllCertificates,
    getMyCertificates,
    getCertificateById,
    verifyCertificate,
    revokeCertificate
} = require("../controllers/certificate.controller");

const protect = require("../middleware/auth");
const authorize = require("../middleware/roleMiddleware");


// ==========================================
// GET ALL CERTIFICATES
// ADMIN + COORDINATOR
//
// GET /api/certificates/manage/all
// ==========================================
router.get(
    "/manage/all",
    protect,
    authorize("admin", "coordinator"),
    getAllCertificates
);


// ==========================================
// GET MY CERTIFICATES
// STUDENT ONLY
//
// GET /api/certificates/my-certificates
// ==========================================
router.get(
    "/my-certificates",
    protect,
    authorize("student"),
    getMyCertificates
);


// ==========================================
// GET ELIGIBLE STUDENTS FOR EVENT
// ADMIN + COORDINATOR
//
// GET /api/certificates/event/:eventId/eligible
// ==========================================
router.get(
    "/event/:eventId/eligible",
    protect,
    authorize("admin", "coordinator"),
    getEligibleStudents
);


// ==========================================
// ISSUE ALL ELIGIBLE CERTIFICATES
// ADMIN + COORDINATOR
//
// POST /api/certificates/event/:eventId/issue-all
// ==========================================
router.post(
    "/event/:eventId/issue-all",
    protect,
    authorize("admin", "coordinator"),
    issueAllCertificates
);


// ==========================================
// GET CERTIFICATES FOR ONE EVENT
// ADMIN + COORDINATOR
//
// GET /api/certificates/event/:eventId
// ==========================================
router.get(
    "/event/:eventId",
    protect,
    authorize("admin", "coordinator"),
    getEventCertificates
);


// ==========================================
// ISSUE ONE CERTIFICATE
// ADMIN + COORDINATOR
//
// POST /api/certificates/issue
// ==========================================
router.post(
    "/issue",
    protect,
    authorize("admin", "coordinator"),
    issueCertificate
);


// ==========================================
// VERIFY CERTIFICATE
// PUBLIC
//
// GET /api/certificates/verify/:certificateNumber
// ==========================================
router.get(
    "/verify/:certificateNumber",
    verifyCertificate
);


// ==========================================
// REVOKE CERTIFICATE
// ADMIN + COORDINATOR
//
// PATCH /api/certificates/:certificateId/revoke
// ==========================================
router.patch(
    "/:certificateId/revoke",
    protect,
    authorize("admin", "coordinator"),
    revokeCertificate
);


// ==========================================
// GET SINGLE CERTIFICATE
// STUDENT + ADMIN + COORDINATOR
//
// GET /api/certificates/:certificateId
// ==========================================
router.get(
    "/:certificateId",
    protect,
    authorize(
        "student",
        "admin",
        "coordinator"
    ),
    getCertificateById
);


// ==========================================
// EXPORT ROUTER
// ==========================================
module.exports = router;