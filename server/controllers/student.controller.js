const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");


// ==========================================
// GET ALL EVENTS FOR STUDENT
// SEARCH + FILTER
// ==========================================
const getAllEventsForStudent = async (req, res) => {
    try {
        const {
            search,
            category,
            status
        } = req.query;

        const filter = {};

        if (search) {
            filter.$or = [
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
                }
            ];
        }

        if (category) {
            filter.category = category;
        }

        if (status) {
            filter.status = status;
        }

        const events = await Event.find(filter)
            .populate(
                "organizer",
                "fullName email"
            )
            .sort({
                date: 1,
                createdAt: -1
            });

        const eventsWithStats = events.map((event) => {
            const eventObject = event.toObject();

            const participantCount =
                event.participants?.length || 0;

            const availableSeats = Math.max(
                event.maxParticipants - participantCount,
                0
            );

            return {
                ...eventObject,
                participantCount,
                availableSeats,
                isFull: availableSeats === 0
            };
        });

        return res.status(200).json({
            success: true,
            count: eventsWithStats.length,

            filters: {
                search: search || "",
                category: category || "",
                status: status || ""
            },

            events: eventsWithStats
        });

    } catch (error) {
        console.error(
            "GET STUDENT EVENTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET SINGLE EVENT DETAILS FOR STUDENT
// ==========================================
const getSingleEventForStudent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const studentId = req.user._id;

        // Find event
        const event = await Event.findById(eventId)
            .populate(
                "organizer",
                "fullName email"
            );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // Count participants
        const participantCount =
            event.participants?.length || 0;

        // Calculate available seats
        const availableSeats = Math.max(
            event.maxParticipants - participantCount,
            0
        );

        // Check whether student is registered
        const registration = await Registration.findOne({
            student: studentId,
            event: eventId
        });

        // Get student favorites
        const user = await User.findById(studentId)
            .select("favoriteEvents");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Check whether event is favorite
        const isFavorite = user.favoriteEvents.some(
            (id) => id.toString() === eventId
        );

        return res.status(200).json({
            success: true,

            event: {
                ...event.toObject(),

                participantCount,

                availableSeats,

                isFull: availableSeats === 0,

                isRegistered: Boolean(registration),

                isFavorite
            }
        });

    } catch (error) {
        console.error(
            "GET SINGLE STUDENT EVENT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// ADD EVENT TO FAVORITES
// ==========================================
const addFavoriteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const alreadyFavorite = user.favoriteEvents.some(
            (id) => id.toString() === eventId
        );

        if (alreadyFavorite) {
            return res.status(400).json({
                success: false,
                message: "Event already added to favorites"
            });
        }

        user.favoriteEvents.push(eventId);

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Event added to favorites successfully"
        });

    } catch (error) {
        console.error("ADD FAVORITE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET MY FAVORITE EVENTS
// ==========================================
const getFavoriteEvents = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate("favoriteEvents");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const validFavorites = user.favoriteEvents.filter(
            (event) => event
        );

        return res.status(200).json({
            success: true,
            count: validFavorites.length,
            favorites: validFavorites
        });

    } catch (error) {
        console.error("GET FAVORITES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// REMOVE EVENT FROM FAVORITES
// ==========================================
const removeFavoriteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const isFavorite = user.favoriteEvents.some(
            (id) => id.toString() === eventId
        );

        if (!isFavorite) {
            return res.status(404).json({
                success: false,
                message: "Event not found in favorites"
            });
        }

        user.favoriteEvents = user.favoriteEvents.filter(
            (id) => id.toString() !== eventId
        );

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Event removed from favorites successfully"
        });

    } catch (error) {
        console.error("REMOVE FAVORITE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET STUDENT DASHBOARD
// ==========================================
const getStudentDashboard = async (req, res) => {
    try {
        const studentId = req.user._id;

        const user = await User.findById(studentId)
            .select("-password")
            .populate("favoriteEvents");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const registrations = await Registration.find({
            student: studentId
        })
            .populate("event")
            .sort({ createdAt: -1 });

        const validRegistrations = registrations.filter(
            (registration) => registration.event
        );

        const upcomingRegistrations =
            validRegistrations.filter(
                (registration) =>
                    registration.event.status === "Upcoming"
            );

        const ongoingRegistrations =
            validRegistrations.filter(
                (registration) =>
                    registration.event.status === "Ongoing"
            );

        const completedRegistrations =
            validRegistrations.filter(
                (registration) =>
                    registration.event.status === "Completed"
            );

        const totalAvailableEvents =
            await Event.countDocuments({
                status: {
                    $in: ["Upcoming", "Ongoing"]
                }
            });

        const validFavorites = user.favoriteEvents.filter(
            (event) => event
        );

        return res.status(200).json({
            success: true,

            dashboard: {
                profile: user,

                events: {
                    available: totalAvailableEvents,
                    registered: validRegistrations.length,
                    upcoming: upcomingRegistrations.length,
                    ongoing: ongoingRegistrations.length,
                    completed: completedRegistrations.length,
                    favorites: validFavorites.length
                },

                gamification: {
                    points: user.points,
                    level: user.level,
                    badges: user.badges
                },

                recentRegistrations:
                    validRegistrations.slice(0, 5),

                upcomingEvents:
                    upcomingRegistrations.slice(0, 5),

                favoriteEvents:
                    validFavorites.slice(0, 5)
            }
        });

    } catch (error) {
        console.error("STUDENT DASHBOARD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// UPDATE STUDENT PROFILE
// ==========================================
const updateProfile = async (req, res) => {
    try {
        const {
            fullName,
            phone,
            department,
            year,
            section,
            profileImage
        } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        if (fullName !== undefined) {
            user.fullName = fullName;
        }

        if (phone !== undefined) {
            user.phone = phone;
        }

        if (department !== undefined) {
            user.department = department;
        }

        if (year !== undefined) {
            user.year = year;
        }

        if (section !== undefined) {
            user.section = section;
        }

        if (profileImage !== undefined) {
            user.profileImage = profileImage;
        }

        await user.save();

        const updatedUser = await User.findById(user._id)
            .select("-password");

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("UPDATE PROFILE ERROR:", error);

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
    getAllEventsForStudent,
    getSingleEventForStudent,
    addFavoriteEvent,
    getFavoriteEvents,
    removeFavoriteEvent,
    getStudentDashboard,
    updateProfile
};