const Feedback = require("../models/Feedback");
const Event = require("../models/Event");
const Registration = require("../models/Registration");


// ==========================================
// SUBMIT FEEDBACK
// STUDENT ONLY
// ==========================================
const submitFeedback = async (req, res) => {
    try {
        const {
            eventId,
            rating,
            comment,
            isAnonymous
        } = req.body;

        // Validate required fields
        if (!eventId || rating === undefined) {
            return res.status(400).json({
                success: false,
                message: "Event ID and rating are required"
            });
        }

        // Validate rating
        const numericRating = Number(rating);

        if (
            !Number.isInteger(numericRating) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(400).json({
                success: false,
                message: "Rating must be a whole number between 1 and 5"
            });
        }

        // Check event exists
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // Student must be registered for the event
        const registration = await Registration.findOne({
            event: eventId,
            student: req.user._id
        });

        if (!registration) {
            return res.status(403).json({
                success: false,
                message: "Only registered students can submit feedback"
            });
        }

        // Prevent duplicate feedback
        const existingFeedback = await Feedback.findOne({
            event: eventId,
            student: req.user._id
        });

        if (existingFeedback) {
            return res.status(400).json({
                success: false,
                message: "You have already submitted feedback for this event"
            });
        }

        // Create feedback
        const feedback = await Feedback.create({
            student: req.user._id,
            event: eventId,
            rating: numericRating,
            comment: comment || "",
            isAnonymous: Boolean(isAnonymous)
        });

        await feedback.populate({
            path: "event",
            select: "title category venue date time status"
        });

        return res.status(201).json({
            success: true,
            message: "Feedback submitted successfully",
            feedback
        });

    } catch (error) {
        console.error("SUBMIT FEEDBACK ERROR:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "You have already submitted feedback for this event"
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET MY FEEDBACK
// STUDENT ONLY
// ==========================================
const getMyFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find({
            student: req.user._id
        })
            .populate({
                path: "event",
                select:
                    "title description category venue date time status organizer",
                populate: {
                    path: "organizer",
                    select: "fullName email"
                }
            })
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,

            summary: {
                totalFeedback: feedback.length
            },

            feedback
        });

    } catch (error) {
        console.error("GET MY FEEDBACK ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// UPDATE MY FEEDBACK
// STUDENT ONLY
// ==========================================
const updateMyFeedback = async (req, res) => {
    try {
        const { feedbackId } = req.params;

        const {
            rating,
            comment,
            isAnonymous
        } = req.body;

        const feedback = await Feedback.findOne({
            _id: feedbackId,
            student: req.user._id
        });

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message:
                    "Feedback not found or you are not authorized"
            });
        }

        // Update rating if provided
        if (rating !== undefined) {
            const numericRating = Number(rating);

            if (
                !Number.isInteger(numericRating) ||
                numericRating < 1 ||
                numericRating > 5
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Rating must be a whole number between 1 and 5"
                });
            }

            feedback.rating = numericRating;
        }

        // Update comment if provided
        if (comment !== undefined) {
            feedback.comment = comment;
        }

        // Update anonymous status if provided
        if (isAnonymous !== undefined) {
            feedback.isAnonymous = Boolean(isAnonymous);
        }

        await feedback.save();

        await feedback.populate({
            path: "event",
            select: "title category venue date time status"
        });

        return res.status(200).json({
            success: true,
            message: "Feedback updated successfully",
            feedback
        });

    } catch (error) {
        console.error("UPDATE FEEDBACK ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// DELETE MY FEEDBACK
// STUDENT ONLY
// ==========================================
const deleteMyFeedback = async (req, res) => {
    try {
        const { feedbackId } = req.params;

        const feedback = await Feedback.findOne({
            _id: feedbackId,
            student: req.user._id
        });

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message:
                    "Feedback not found or you are not authorized"
            });
        }

        await feedback.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Feedback deleted successfully"
        });

    } catch (error) {
        console.error("DELETE FEEDBACK ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET FEEDBACK FOR MY EVENT
// COORDINATOR ONLY
// ==========================================
const getEventFeedback = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Event must belong to logged-in coordinator
        const event = await Event.findOne({
            _id: eventId,
            organizer: req.user._id
        }).select(
            "title category venue date time status"
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message:
                    "Event not found or you are not the organizer"
            });
        }

        const feedbackRecords = await Feedback.find({
            event: eventId
        })
            .populate(
                "student",
                "fullName registerNumber email department year section"
            )
            .sort({
                createdAt: -1
            });

        // Calculate rating summary
        const totalFeedback = feedbackRecords.length;

        const averageRating =
            totalFeedback > 0
                ? Number(
                    (
                        feedbackRecords.reduce(
                            (total, feedback) =>
                                total + feedback.rating,
                            0
                        ) / totalFeedback
                    ).toFixed(2)
                )
                : 0;

        const ratingBreakdown = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        };

        feedbackRecords.forEach((feedback) => {
            ratingBreakdown[feedback.rating]++;
        });

        // Hide student identity for anonymous feedback
        const safeFeedback = feedbackRecords.map(
            (feedback) => {
                const feedbackObject =
                    feedback.toObject();

                if (feedbackObject.isAnonymous) {
                    feedbackObject.student = null;
                }

                return feedbackObject;
            }
        );

        return res.status(200).json({
            success: true,

            event,

            summary: {
                totalFeedback,
                averageRating,
                ratingBreakdown
            },

            feedback: safeFeedback
        });

    } catch (error) {
        console.error(
            "GET EVENT FEEDBACK ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================
module.exports = {
    submitFeedback,
    getMyFeedback,
    updateMyFeedback,
    deleteMyFeedback,
    getEventFeedback
};