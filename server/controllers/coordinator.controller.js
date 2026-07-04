const Event = require("../models/Event");
const Registration = require("../models/Registration");


// ==========================================
// GET COORDINATOR DASHBOARD
// ==========================================
const getCoordinatorDashboard = async (req, res) => {
    try {
        const coordinatorId = req.user._id;

        const events = await Event.find({
            organizer: coordinatorId
        }).sort({ createdAt: -1 });

        const eventIds = events.map((event) => event._id);

        const totalRegistrations =
            await Registration.countDocuments({
                event: {
                    $in: eventIds
                }
            });

        const upcomingEvents = events.filter(
            (event) => event.status === "Upcoming"
        ).length;

        const ongoingEvents = events.filter(
            (event) => event.status === "Ongoing"
        ).length;

        const completedEvents = events.filter(
            (event) => event.status === "Completed"
        ).length;

        return res.status(200).json({
            success: true,

            dashboard: {
                coordinator: {
                    _id: req.user._id,
                    fullName: req.user.fullName,
                    email: req.user.email,
                    role: req.user.role
                },

                events: {
                    total: events.length,
                    upcoming: upcomingEvents,
                    ongoing: ongoingEvents,
                    completed: completedEvents
                },

                registrations: {
                    total: totalRegistrations
                },

                recentEvents: events.slice(0, 5)
            }
        });

    } catch (error) {
        console.error(
            "COORDINATOR DASHBOARD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET MY EVENTS
// ==========================================
const getMyEvents = async (req, res) => {
    try {
        const events = await Event.find({
            organizer: req.user._id
        }).sort({ createdAt: -1 });

        const eventsWithStats = await Promise.all(
            events.map(async (event) => {

                const registrationCount =
                    await Registration.countDocuments({
                        event: event._id
                    });

                return {
                    ...event.toObject(),

                    registrationCount,

                    availableSeats: Math.max(
                        event.maxParticipants -
                            registrationCount,
                        0
                    )
                };
            })
        );

        return res.status(200).json({
            success: true,
            count: eventsWithStats.length,
            events: eventsWithStats
        });

    } catch (error) {
        console.error(
            "GET COORDINATOR EVENTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET PARTICIPANTS OF MY EVENT
// ==========================================
const getEventParticipants = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findOne({
            _id: eventId,
            organizer: req.user._id
        });

        if (!event) {
            return res.status(404).json({
                success: false,
                message:
                    "Event not found or you are not the organizer"
            });
        }

        const registrations = await Registration.find({
            event: eventId
        })
            .populate(
                "student",
                "fullName registerNumber email department year section phone"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,

            event: {
                _id: event._id,
                title: event.title,
                maxParticipants: event.maxParticipants
            },

            participantCount: registrations.length,

            availableSeats: Math.max(
                event.maxParticipants -
                    registrations.length,
                0
            ),

            participants: registrations
        });

    } catch (error) {
        console.error(
            "GET EVENT PARTICIPANTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// UPDATE MY EVENT
// ==========================================
const updateMyEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findOne({
            _id: eventId,
            organizer: req.user._id
        });

        if (!event) {
            return res.status(404).json({
                success: false,
                message:
                    "Event not found or you are not the organizer"
            });
        }

        const allowedFields = [
            "title",
            "description",
            "category",
            "venue",
            "date",
            "time",
            "image",
            "maxParticipants",
            "status"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                event[field] = req.body[field];
            }
        });

        await event.save();

        return res.status(200).json({
            success: true,
            message: "Event updated successfully",
            event
        });

    } catch (error) {
        console.error(
            "UPDATE COORDINATOR EVENT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// DELETE MY EVENT
// ==========================================
const deleteMyEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Event must belong to logged-in coordinator
        const event = await Event.findOne({
            _id: eventId,
            organizer: req.user._id
        });

        if (!event) {
            return res.status(404).json({
                success: false,
                message:
                    "Event not found or you are not the organizer"
            });
        }

        // Check whether students are registered
        const registrationCount =
            await Registration.countDocuments({
                event: eventId
            });

        // Block deletion if registrations exist
        if (registrationCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot delete event because students are already registered",
                registrationCount
            });
        }

        // Safe to delete
        await Event.findByIdAndDelete(eventId);

        return res.status(200).json({
            success: true,
            message: "Event deleted successfully"
        });

    } catch (error) {
        console.error(
            "DELETE COORDINATOR EVENT ERROR:",
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
    getCoordinatorDashboard,
    getMyEvents,
    getEventParticipants,
    updateMyEvent,
    deleteMyEvent
};