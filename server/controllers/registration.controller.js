const Registration = require("../models/Registration");
const Event = require("../models/Event");
const Notification = require("../models/NotificationModel");


// ==========================================
// REGISTER FOR AN EVENT
// STUDENT ONLY
// ==========================================
const registerForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const studentId = req.user._id;

        // Check if event exists
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // Check event status
        if (event.status === "Cancelled") {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot register for a cancelled event"
            });
        }

        if (event.status === "Completed") {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot register for a completed event"
            });
        }

        // Check duplicate registration
        const existingRegistration =
            await Registration.findOne({
                student: studentId,
                event: eventId
            });

        if (existingRegistration) {
            return res.status(400).json({
                success: false,
                message:
                    "You are already registered for this event"
            });
        }

        // Count actual registrations
        const registrationCount =
            await Registration.countDocuments({
                event: eventId
            });

        // Check event capacity
        if (
            registrationCount >=
            event.maxParticipants
        ) {
            return res.status(400).json({
                success: false,
                message: "Event is full"
            });
        }

        // Create registration
        const registration =
            await Registration.create({
                student: studentId,
                event: eventId
            });

        // Add student to participants array
        await Event.findByIdAndUpdate(
            eventId,
            {
                $addToSet: {
                    participants: studentId
                }
            }
        );

        // ==========================================
        // CREATE REGISTRATION NOTIFICATION
        // ==========================================
        await Notification.create({
            user: studentId,
            title: "🎟️ Registration Successful",
            message:
                `You have successfully registered for "${event.title}".`,
            type: "Registration",
            relatedEvent: eventId,
            isRead: false
        });

        // Populate event details
        await registration.populate("event");

        return res.status(201).json({
            success: true,
            message: "Event registration successful",
            registration
        });

    } catch (error) {
        console.error(
            "REGISTER EVENT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET MY REGISTERED EVENTS
// STUDENT ONLY
// ==========================================
const getMyRegistrations = async (req, res) => {
    try {
        const registrations =
            await Registration.find({
                student: req.user._id
            })
                .populate("event")
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            count: registrations.length,
            registrations
        });

    } catch (error) {
        console.error(
            "GET REGISTRATIONS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// CANCEL EVENT REGISTRATION
// STUDENT ONLY
// ==========================================
const cancelRegistration = async (req, res) => {
    try {
        const { eventId } = req.params;
        const studentId = req.user._id;

        // Find student's registration
        const registration =
            await Registration.findOne({
                student: studentId,
                event: eventId
            });

        if (!registration) {
            return res.status(404).json({
                success: false,
                message:
                    "You are not registered for this event"
            });
        }

        // Get event before cancellation
        const event = await Event.findById(eventId);

        // Delete registration
        await Registration.findByIdAndDelete(
            registration._id
        );

        // Remove student from event participants
        await Event.findByIdAndUpdate(
            eventId,
            {
                $pull: {
                    participants: studentId
                }
            }
        );

        // ==========================================
        // CREATE CANCELLATION NOTIFICATION
        // ==========================================
        if (event) {
            await Notification.create({
                user: studentId,
                title: "🚫 Registration Cancelled",
                message:
                    `Your registration for "${event.title}" has been cancelled.`,
                type: "Registration",
                relatedEvent: eventId,
                isRead: false
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Event registration cancelled successfully"
        });

    } catch (error) {
        console.error(
            "CANCEL REGISTRATION ERROR:",
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
    registerForEvent,
    getMyRegistrations,
    cancelRegistration
};