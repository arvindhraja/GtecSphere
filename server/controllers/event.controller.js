const Event = require("../models/Event");

// ==========================================
// CREATE EVENT
// ==========================================
const createEvent = async (req, res) => {
    try {
        const event = await Event.create({
            ...req.body,
            organizer: req.user._id
        });

        return res.status(201).json({
            success: true,
            message: "Event created successfully",
            event
        });

    } catch (error) {
        console.error("CREATE EVENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET ALL EVENTS
// SEARCH + FILTER + SORT
// ==========================================
const getEvents = async (req, res) => {
    try {
        const {
            search,
            category,
            status,
            sort
        } = req.query;

        const query = {};

        // Search by title, description or venue
        if (search) {
            query.$or = [
                {
                    title: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    venue: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }

        // Filter by category
        if (category) {
            query.category = {
                $regex: `^${category}$`,
                $options: "i"
            };
        }

        // Filter by status
        if (status) {
            query.status = {
                $regex: `^${status}$`,
                $options: "i"
            };
        }

        // Default: newest event date first
        let sortOption = {
            date: 1
        };

        if (sort === "latest") {
            sortOption = {
                createdAt: -1
            };
        }

        if (sort === "oldest") {
            sortOption = {
                createdAt: 1
            };
        }

        const events = await Event.find(query)
            .populate("organizer", "fullName email")
            .sort(sortOption);

        // Add available seats
        const eventsWithSeats = events.map((event) => {
            const eventObject = event.toObject();

            const participantCount =
                event.participants?.length || 0;

            return {
                ...eventObject,
                participantCount,
                availableSeats: Math.max(
                    event.maxParticipants - participantCount,
                    0
                )
            };
        });

        return res.status(200).json({
            success: true,
            count: eventsWithSeats.length,
            events: eventsWithSeats
        });

    } catch (error) {
        console.error("GET EVENTS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET SINGLE EVENT
// ==========================================
const getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate("organizer", "fullName email");

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        const eventObject = event.toObject();

        const participantCount =
            event.participants?.length || 0;

        const eventWithSeats = {
            ...eventObject,

            participantCount,

            availableSeats: Math.max(
                event.maxParticipants - participantCount,
                0
            )
        };

        return res.status(200).json({
            success: true,
            event: eventWithSeats
        });

    } catch (error) {
        console.error("GET SINGLE EVENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// UPDATE EVENT
// ==========================================
const updateEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event updated successfully",
            event
        });

    } catch (error) {
        console.error("UPDATE EVENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// DELETE EVENT
// ==========================================
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        await event.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Event deleted successfully"
        });

    } catch (error) {
        console.error("DELETE EVENT ERROR:", error);

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
    createEvent,
    getEvents,
    getEvent,
    updateEvent,
    deleteEvent
};