const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");


// ==========================================
// GET ADMIN DASHBOARD STATISTICS
// ==========================================
const getDashboardStats = async (req, res) => {
    try {
        // User statistics
        const totalUsers = await User.countDocuments();

        const totalStudents = await User.countDocuments({
            role: "student"
        });

        const totalCoordinators = await User.countDocuments({
            role: "coordinator"
        });

        const totalAdmins = await User.countDocuments({
            role: "admin"
        });

        const activeUsers = await User.countDocuments({
            isActive: true
        });

        const inactiveUsers = await User.countDocuments({
            isActive: false
        });

        // Event statistics
        const totalEvents = await Event.countDocuments();

        const upcomingEvents = await Event.countDocuments({
            status: "Upcoming"
        });

        const ongoingEvents = await Event.countDocuments({
            status: "Ongoing"
        });

        const completedEvents = await Event.countDocuments({
            status: "Completed"
        });

        // Registration statistics
        const totalRegistrations =
            await Registration.countDocuments();

        // Recent users
        const recentUsers = await User.find()
            .select("-password")
            .sort({ createdAt: -1 })
            .limit(5);

        // Recent events
        const recentEvents = await Event.find()
            .populate("organizer", "fullName email role")
            .sort({ createdAt: -1 })
            .limit(5);

        return res.status(200).json({
            success: true,

            dashboard: {
                users: {
                    total: totalUsers,
                    students: totalStudents,
                    coordinators: totalCoordinators,
                    admins: totalAdmins,
                    active: activeUsers,
                    inactive: inactiveUsers
                },

                events: {
                    total: totalEvents,
                    upcoming: upcomingEvents,
                    ongoing: ongoingEvents,
                    completed: completedEvents
                },

                registrations: {
                    total: totalRegistrations
                },

                recentUsers,
                recentEvents
            }
        });

    } catch (error) {
        console.error("ADMIN DASHBOARD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET ALL USERS
// ==========================================
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error("GET ALL USERS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// ACTIVATE / DEACTIVATE USER
// ==========================================
const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Protect admin accounts
        if (user.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin account status cannot be changed"
            });
        }

        user.isActive = !user.isActive;

        await user.save();

        const updatedUser = await User.findById(user._id)
            .select("-password");

        return res.status(200).json({
            success: true,

            message: `User ${
                updatedUser.isActive
                    ? "activated"
                    : "deactivated"
            } successfully`,

            user: updatedUser
        });

    } catch (error) {
        console.error("TOGGLE USER STATUS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// UPDATE USER ROLE
// ADMIN CAN ASSIGN / REMOVE COORDINATOR
// ==========================================
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        // Admin can assign only these roles
        const allowedRoles = [
            "student",
            "coordinator"
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be student or coordinator"
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Protect admin accounts
        if (user.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin role cannot be changed"
            });
        }

        // Check if role is already assigned
        if (user.role === role) {
            return res.status(400).json({
                success: false,
                message: `User is already a ${role}`
            });
        }

        // Update role
        user.role = role;

        await user.save();

        const updatedUser = await User.findById(user._id)
            .select("-password");

        return res.status(200).json({
            success: true,
            message: `User role updated to ${role} successfully`,
            user: updatedUser
        });

    } catch (error) {
        console.error("UPDATE USER ROLE ERROR:", error);

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
    getDashboardStats,
    getAllUsers,
    toggleUserStatus,
    updateUserRole
};