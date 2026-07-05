const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Certificate = require("../models/Certificate");
const bcrypt = require("bcryptjs");


// ==========================================
// GET ADMIN DASHBOARD STATISTICS
// ADMIN ONLY
// ==========================================
const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalStudents,
            totalCoordinators,
            totalAdmins,
            activeUsers,
            inactiveUsers,

            totalEvents,
            upcomingEvents,
            ongoingEvents,
            completedEvents,

            totalRegistrations,
            totalCertificates
        ] = await Promise.all([
            User.countDocuments(),

            User.countDocuments({
                role: "student"
            }),

            User.countDocuments({
                role: "coordinator"
            }),

            User.countDocuments({
                role: "admin"
            }),

            User.countDocuments({
                isActive: true
            }),

            User.countDocuments({
                isActive: false
            }),

            Event.countDocuments(),

            Event.countDocuments({
                status: "Upcoming"
            }),

            Event.countDocuments({
                status: "Ongoing"
            }),

            Event.countDocuments({
                status: "Completed"
            }),

            Registration.countDocuments(),

            Certificate.countDocuments({
                status: "Issued"
            })
        ]);


        // ==========================================
        // RECENT USERS
        // ==========================================
        const recentUsers = await User.find()
            .select("-password")
            .sort({
                createdAt: -1
            })
            .limit(5);


        // ==========================================
        // RECENT EVENTS
        // ==========================================
        const recentEvents = await Event.find()
            .populate(
                "organizer",
                "fullName email role"
            )
            .sort({
                createdAt: -1
            })
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

                certificates: {
                    total: totalCertificates
                },

                recentUsers,
                recentEvents
            }
        });

    } catch (error) {
        console.error(
            "ADMIN DASHBOARD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET ALL USERS
// ADMIN ONLY
// ==========================================
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error(
            "GET ALL USERS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET ALL STUDENTS
// ADMIN ONLY
//
// SEARCH + FILTER
// ==========================================
const getAllStudents = async (req, res) => {
    try {
        const {
            search = "",
            department = "",
            year = "",
            status = ""
        } = req.query;


        const query = {
            role: "student"
        };


        // ==========================================
        // SEARCH STUDENT
        // ==========================================
        if (search.trim()) {
            query.$or = [
                {
                    fullName: {
                        $regex: search.trim(),
                        $options: "i"
                    }
                },
                {
                    email: {
                        $regex: search.trim(),
                        $options: "i"
                    }
                },
                {
                    registerNumber: {
                        $regex: search.trim(),
                        $options: "i"
                    }
                }
            ];
        }


        // ==========================================
        // FILTER BY DEPARTMENT
        // ==========================================
        if (department.trim()) {
            query.department = {
                $regex: `^${department.trim()}$`,
                $options: "i"
            };
        }


        // ==========================================
        // FILTER BY YEAR
        // ==========================================
        if (year.trim()) {
            query.year = {
                $regex: `^${year.trim()}$`,
                $options: "i"
            };
        }


        // ==========================================
        // FILTER BY ACCOUNT STATUS
        // ==========================================
        if (status === "active") {
            query.isActive = true;
        }

        if (status === "inactive") {
            query.isActive = false;
        }


        const students = await User.find(query)
            .select("-password")
            .sort({
                createdAt: -1
            });


        return res.status(200).json({
            success: true,
            count: students.length,
            students
        });

    } catch (error) {
        console.error(
            "GET ALL STUDENTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET SINGLE STUDENT
// ADMIN ONLY
// ==========================================
const getStudentById = async (req, res) => {
    try {
        const student = await User.findOne({
            _id: req.params.id,
            role: "student"
        }).select("-password");


        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }


        const registrations =
            await Registration.find({
                student: student._id
            })
                .populate(
                    "event",
                    "title date venue category status"
                )
                .sort({
                    createdAt: -1
                });


        const certificates =
            await Certificate.find({
                student: student._id
            })
                .populate(
                    "event",
                    "title date venue category"
                )
                .sort({
                    issuedAt: -1
                });


        return res.status(200).json({
            success: true,

            student,

            activity: {
                totalRegistrations:
                    registrations.length,

                totalCertificates:
                    certificates.length,

                registrations,

                certificates
            }
        });

    } catch (error) {
        console.error(
            "GET STUDENT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// ACTIVATE / DEACTIVATE USER
// ADMIN ONLY
// ==========================================
const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(
            req.params.id
        );


        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        // ==========================================
        // PROTECT ADMIN ACCOUNTS
        // ==========================================
        if (user.role === "admin") {
            return res.status(403).json({
                success: false,
                message:
                    "Admin account status cannot be changed"
            });
        }


        user.isActive = !user.isActive;

        await user.save();


        const updatedUser = await User.findById(
            user._id
        ).select("-password");


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
        console.error(
            "TOGGLE USER STATUS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// UPDATE USER ROLE
// ADMIN ONLY
// ==========================================
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;


        const allowedRoles = [
            "student",
            "coordinator"
        ];


        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message:
                    "Role must be student or coordinator"
            });
        }


        const user = await User.findById(
            req.params.id
        );


        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        if (user.role === "admin") {
            return res.status(403).json({
                success: false,
                message:
                    "Admin role cannot be changed"
            });
        }


        if (user.role === role) {
            return res.status(400).json({
                success: false,
                message:
                    `User is already a ${role}`
            });
        }


        user.role = role;

        await user.save();


        const updatedUser = await User.findById(
            user._id
        ).select("-password");


        return res.status(200).json({
            success: true,
            message:
                `User role updated to ${role} successfully`,
            user: updatedUser
        });

    } catch (error) {
        console.error(
            "UPDATE USER ROLE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// CREATE COORDINATOR ACCOUNT
// ADMIN ONLY
// ==========================================
const createCoordinator = async (req, res) => {
    try {
        console.log(
            "CREATE COORDINATOR BODY:",
            req.body
        );

        console.log(
            "ADMIN USER:",
            req.user
        );

        const {
            fullName,
            email,
            password,
            department,
            phone
        } = req.body;


        if (
            !fullName ||
            !email ||
            !password ||
            !department ||
            !phone
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Full name, email, password, department and phone are required"
            });
        }


        const normalizedEmail = email
            .trim()
            .toLowerCase();


        const existingUser = await User.findOne({
            email: normalizedEmail
        });


        if (existingUser) {
            return res.status(400).json({
                success: false,
                message:
                    "A user with this email already exists"
            });
        }


        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        const coordinator = await User.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "coordinator",
            department: department.trim(),
            phone: phone.trim(),
            isActive: true,
            isVerified: true
        });


        const safeCoordinator =
            await User.findById(
                coordinator._id
            ).select("-password");


        return res.status(201).json({
            success: true,
            message:
                "Coordinator account created successfully",
            coordinator: safeCoordinator
        });

    } catch (error) {
        console.error(
            "CREATE COORDINATOR ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET ALL COORDINATORS
// ADMIN ONLY
// ==========================================
const getAllCoordinators = async (req, res) => {
    try {
        const coordinators = await User.find({
            role: "coordinator"
        })
            .select("-password")
            .populate(
                "assignedEvents",
                "title date venue category status department"
            )
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            count: coordinators.length,
            coordinators
        });

    } catch (error) {
        console.error(
            "GET ALL COORDINATORS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// ==========================================
// ASSIGN EVENTS TO COORDINATOR
// ADMIN ONLY
// ==========================================
const assignCoordinatorEvents = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            eventIds
        } = req.body;


        // ==========================================
        // VALIDATE EVENT IDS ARRAY
        // ==========================================
        if (!Array.isArray(eventIds)) {
            return res.status(400).json({
                success: false,
                message:
                    "eventIds must be an array"
            });
        }


        // ==========================================
        // FIND COORDINATOR
        // ==========================================
        const coordinator = await User.findOne({
            _id: id,
            role: "coordinator"
        });


        if (!coordinator) {
            return res.status(404).json({
                success: false,
                message:
                    "Coordinator not found"
            });
        }


        // ==========================================
        // REMOVE DUPLICATE EVENT IDS
        // ==========================================
        const uniqueEventIds = [
            ...new Set(
                eventIds.map(
                    (eventId) =>
                        eventId.toString()
                )
            )
        ];


        // ==========================================
        // CHECK ALL EVENTS EXIST
        // ==========================================
        const existingEvents =
            await Event.find({
                _id: {
                    $in: uniqueEventIds
                }
            }).select("_id");


        if (
            existingEvents.length !==
            uniqueEventIds.length
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "One or more selected events do not exist"
            });
        }


        // ==========================================
        // SAVE ASSIGNED EVENTS
        // ==========================================
        coordinator.assignedEvents =
            uniqueEventIds;

        await coordinator.save();


        // ==========================================
        // RETURN UPDATED COORDINATOR
        // ==========================================
        const updatedCoordinator =
            await User.findById(
                coordinator._id
            )
                .select("-password")
                .populate(
                    "assignedEvents",
                    "title date venue category status department"
                );


        return res.status(200).json({
            success: true,

            message:
                uniqueEventIds.length > 0
                    ? "Events assigned successfully"
                    : "All event assignments cleared successfully",

            coordinator:
                updatedCoordinator
        });

    } catch (error) {
        console.error(
            "ASSIGN COORDINATOR EVENTS ERROR:",
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
    getDashboardStats,

    getAllUsers,

    getAllStudents,
    getStudentById,

    toggleUserStatus,
    updateUserRole,

    createCoordinator,
    getAllCoordinators,

    assignCoordinatorEvents
};