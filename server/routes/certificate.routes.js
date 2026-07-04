const express = require("express");

const router = express.Router();

const {
    issueCertificate,
    getMyCertificates,
    getCertificateById,
    verifyCertificate,
    getCoordinatorCertificates,
    revokeCertificate
} = require("../controllers/certificate.controller");

const protect = require("../middleware/auth");
const authorize = require("../middleware/roleMiddleware");


// ==========================================
// ISSUE CERTIFICATE
// COORDINATOR / ADMIN
// ==========================================
router.post(
    "/issue",
    protect,
    authorize("coordinator", "admin"),
    issueCertificate
);


// ==========================================
// GET MY CERTIFICATES
// STUDENT ONLY
// ==========================================
router.get(
    "/my-certificates",
    protect,
    authorize("student"),
    getMyCertificates
);


// ==========================================
// GET COORDINATOR CERTIFICATES
// COORDINATOR ONLY
// ==========================================
router.get(
    "/coordinator/all",
    protect,
    authorize("coordinator"),
    getCoordinatorCertificates
);


// ==========================================
// VERIFY CERTIFICATE
// PUBLIC ACCESS - NO LOGIN REQUIRED
// ==========================================
router.get(
    "/verify/:certificateNumber",
    verifyCertificate
);


// ==========================================
// REVOKE CERTIFICATE
// COORDINATOR / ADMIN
// ==========================================
router.patch(
    "/:certificateId/revoke",
    protect,
    authorize("coordinator", "admin"),
    revokeCertificate
);


// ==========================================
// GET SINGLE CERTIFICATE
// STUDENT / COORDINATOR / ADMIN
// ==========================================
router.get(
    "/:certificateId",
    protect,
    authorize("student", "coordinator", "admin"),
    getCertificateById
);


module.exports = router;