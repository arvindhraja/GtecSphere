const express = require("express");

const router = express.Router();

const {
    submitFeedback,
    getMyFeedback,
    updateMyFeedback,
    deleteMyFeedback,
    getEventFeedback
} = require("../controllers/feedback.controller");

const protect = require("../middleware/auth");
const authorize = require("../middleware/roleMiddleware");


// ==========================================
// SUBMIT FEEDBACK
// STUDENT ONLY
// ==========================================
router.post(
    "/",
    protect,
    authorize("student"),
    submitFeedback
);


// ==========================================
// GET MY FEEDBACK
// STUDENT ONLY
// ==========================================
router.get(
    "/my-feedback",
    protect,
    authorize("student"),
    getMyFeedback
);


// ==========================================
// GET FEEDBACK FOR COORDINATOR'S EVENT
// COORDINATOR ONLY
// ==========================================
router.get(
    "/event/:eventId",
    protect,
    authorize("coordinator"),
    getEventFeedback
);


// ==========================================
// UPDATE MY FEEDBACK
// STUDENT ONLY
// ==========================================
router.patch(
    "/:feedbackId",
    protect,
    authorize("student"),
    updateMyFeedback
);


// ==========================================
// DELETE MY FEEDBACK
// STUDENT ONLY
// ==========================================
router.delete(
    "/:feedbackId",
    protect,
    authorize("student"),
    deleteMyFeedback
);


module.exports = router;