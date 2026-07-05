const Registration = require("../models/Registration");
const Event = require("../models/Event");
const Notification = require("../models/NotificationModel");


// ==========================================
// GENERATE UNIQUE ACKNOWLEDGEMENT NUMBER
// ==========================================
const generateAcknowledgementNumber = async () => {
    let acknowledgementNumber;
    let alreadyExists = true;

    while (alreadyExists) {
        const year = new Date().getFullYear();

        const randomCode = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

        acknowledgementNumber =
            `GTEC-${year}-${randomCode}`;

        alreadyExists =
            await Registration.exists({
                acknowledgementNumber
            });
    }

    return acknowledgementNumber;
};


// ==========================================
// REGISTER FOR AN EVENT
// INDIVIDUAL + TEAM REGISTRATION
// STUDENT ONLY
// ==========================================
const registerForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const studentId = req.user._id;

        const {
            registrationType = "Individual",
            teamName = "",
            teamMembers = [],
            projectTitle = "",
            projectDescription = ""
        } = req.body;


        // ==========================================
        // CHECK EVENT
        // ==========================================
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }


        // ==========================================
        // ONLY PUBLISHED EVENTS
        // ==========================================
        if (
            event.publicationStatus &&
            event.publicationStatus !== "Published"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Registration is not open for this event"
            });
        }


        // ==========================================
        // CHECK EVENT STATUS
        // ==========================================
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


        // ==========================================
        // VALIDATE REGISTRATION TYPE
        // ==========================================
        if (
            !["Individual", "Team"].includes(
                registrationType
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Registration type must be Individual or Team"
            });
        }


        // ==========================================
        // VALIDATE TEAM REGISTRATION
        // ==========================================
        if (registrationType === "Team") {
            if (!teamName.trim()) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Team name is required for team registration"
                });
            }

            if (
                !Array.isArray(teamMembers) ||
                teamMembers.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Add at least one team member"
                });
            }

            for (const member of teamMembers) {
                if (
                    !member.name ||
                    !member.name.trim() ||
                    !member.registerNumber ||
                    !member.registerNumber.trim()
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Every team member must have a name and register number"
                    });
                }
            }


            // PREVENT DUPLICATE REGISTER NUMBERS
            const registerNumbers =
                teamMembers.map((member) =>
                    member.registerNumber
                        .trim()
                        .toLowerCase()
                );

            const uniqueRegisterNumbers =
                new Set(registerNumbers);

            if (
                uniqueRegisterNumbers.size !==
                registerNumbers.length
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Duplicate team members are not allowed"
                });
            }
        }


        // ==========================================
        // CHECK DUPLICATE REGISTRATION
        // ==========================================
        const existingRegistration =
            await Registration.findOne({
                student: studentId,
                event: eventId
            });

        if (existingRegistration) {
            return res.status(400).json({
                success: false,
                message:
                    "You are already registered for this event",
                acknowledgementNumber:
                    existingRegistration
                        .acknowledgementNumber
            });
        }


        // ==========================================
        // COUNT REGISTRATIONS
        // ==========================================
        const registrationCount =
            await Registration.countDocuments({
                event: eventId,
                status: {
                    $ne: "Cancelled"
                }
            });


        // ==========================================
        // CHECK EVENT CAPACITY
        // ==========================================
        if (
            registrationCount >=
            event.maxParticipants
        ) {
            return res.status(400).json({
                success: false,
                message: "Event is full"
            });
        }


        // ==========================================
        // GENERATE ACKNOWLEDGEMENT
        // ==========================================
        const acknowledgementNumber =
            await generateAcknowledgementNumber();


        // ==========================================
        // CREATE REGISTRATION
        // ==========================================
        const registration =
            await Registration.create({
                student: studentId,

                event: eventId,

                registrationType,

                teamName:
                    registrationType === "Team"
                        ? teamName.trim()
                        : "",

                teamMembers:
                    registrationType === "Team"
                        ? teamMembers
                        : [],

                projectTitle:
                    projectTitle.trim(),

                projectDescription:
                    projectDescription.trim(),

                acknowledgementNumber,

                status: "Registered"
            });


        // ==========================================
        // ADD STUDENT TO EVENT PARTICIPANTS
        // ==========================================
        await Event.findByIdAndUpdate(
            eventId,
            {
                $addToSet: {
                    participants: studentId
                }
            }
        );


        // ==========================================
        // CREATE NOTIFICATION
        // ==========================================
        await Notification.create({
            user: studentId,

            title:
                "🎟️ Registration Successful",

            message:
                `You have successfully registered for "${event.title}". Acknowledgement: ${acknowledgementNumber}`,

            type: "Registration",

            relatedEvent: eventId,

            isRead: false
        });


        // ==========================================
        // POPULATE DETAILS
        // ==========================================
        await registration.populate([
            {
                path: "student",
                select:
                    "fullName email registerNumber department year section"
            },
            {
                path: "event",
                select:
                    "title description category venue date time status publicationStatus"
            }
        ]);


        return res.status(201).json({
            success: true,

            message:
                "Event registration successful",

            acknowledgement: {
                acknowledgementNumber,

                registrationType,

                teamName:
                    registration.teamName,

                event:
                    registration.event,

                status:
                    registration.status,

                registeredAt:
                    registration.registeredAt
            },

            registration
        });

    } catch (error) {
        console.error(
            "REGISTER EVENT ERROR:",
            error
        );


        // DUPLICATE DATABASE ERROR
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message:
                    "Duplicate registration or acknowledgement detected"
            });
        }


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
                .populate({
                    path: "event",
                    select:
                        "title description category venue date time status publicationStatus"
                })
                .populate({
                    path: "reviewedBy",
                    select:
                        "fullName email role"
                })
                .sort({
                    createdAt: -1
                });


        const summary = {
            totalRegistrations:
                registrations.length,

            individual:
                registrations.filter(
                    (registration) =>
                        registration
                            .registrationType ===
                        "Individual"
                ).length,

            team:
                registrations.filter(
                    (registration) =>
                        registration
                            .registrationType ===
                        "Team"
                ).length,

            approved:
                registrations.filter(
                    (registration) =>
                        registration.status ===
                        "Approved"
                ).length,

            registered:
                registrations.filter(
                    (registration) =>
                        registration.status ===
                        "Registered"
                ).length
        };


        return res.status(200).json({
            success: true,
            count: registrations.length,
            summary,
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
// GET SINGLE REGISTRATION
// STUDENT OWNER ONLY
// ==========================================
const getMyRegistrationById = async (
    req,
    res
) => {
    try {
        const registration =
            await Registration.findOne({
                _id: req.params.registrationId,
                student: req.user._id
            })
                .populate({
                    path: "student",
                    select:
                        "fullName email registerNumber department year section"
                })
                .populate({
                    path: "event",
                    select:
                        "title description category venue date time status"
                })
                .populate({
                    path: "reviewedBy",
                    select:
                        "fullName role"
                });


        if (!registration) {
            return res.status(404).json({
                success: false,
                message:
                    "Registration not found"
            });
        }


        return res.status(200).json({
            success: true,
            registration
        });

    } catch (error) {
        console.error(
            "GET REGISTRATION ERROR:",
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
const cancelRegistration = async (
    req,
    res
) => {
    try {
        const { eventId } = req.params;

        const studentId = req.user._id;


        // ==========================================
        // FIND REGISTRATION
        // ==========================================
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


        if (
            registration.status ===
            "Cancelled"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Registration is already cancelled"
            });
        }


        if (
            registration.status ===
            "Attended"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Attended registration cannot be cancelled"
            });
        }


        // ==========================================
        // GET EVENT
        // ==========================================
        const event =
            await Event.findById(eventId);


        // ==========================================
        // UPDATE STATUS
        // DO NOT DELETE ACKNOWLEDGEMENT
        // ==========================================
        registration.status = "Cancelled";

        await registration.save();


        // ==========================================
        // REMOVE FROM PARTICIPANTS
        // ==========================================
        await Event.findByIdAndUpdate(
            eventId,
            {
                $pull: {
                    participants: studentId
                }
            }
        );


        // ==========================================
        // CREATE NOTIFICATION
        // ==========================================
        if (event) {
            await Notification.create({
                user: studentId,

                title:
                    "🚫 Registration Cancelled",

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
                "Event registration cancelled successfully",

            acknowledgementNumber:
                registration
                    .acknowledgementNumber,

            registration
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
// GET ALL REGISTRATIONS
// ADMIN + COORDINATOR
// ==========================================
const getAllRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find()
            .populate({
                path: "student",
                select:
                    "fullName email registerNumber department year section"
            })
            .populate({
                path: "event",
                select:
                    "title category venue date time status publicationStatus"
            })
            .populate({
                path: "reviewedBy",
                select:
                    "fullName email role"
            })
            .sort({
                createdAt: -1
            });

        const summary = {
            totalRegistrations:
                registrations.length,

            confirmed:
                registrations.filter(
                    (registration) =>
                        registration.status === "Registered" ||
                        registration.status === "Approved"
                ).length,

            pending:
                registrations.filter(
                    (registration) =>
                        registration.status === "Pending"
                ).length,

            cancelled:
                registrations.filter(
                    (registration) =>
                        registration.status === "Cancelled"
                ).length
        };

        return res.status(200).json({
            success: true,
            count: registrations.length,
            summary,
            registrations
        });

    } catch (error) {
        console.error(
            "GET ALL REGISTRATIONS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// ==========================================
// GET EVENT REGISTRATIONS FOR SEAT MANAGEMENT
// ADMIN + COORDINATOR
// ==========================================
const getEventRegistrationsForSeats = async (req, res) => {
    try {
        const registrations = await Registration.find({
            event: req.params.eventId,
            status: {
                $ne: "Cancelled"
            }
        })
            .populate({
                path: "student",
                select:
                    "fullName email registerNumber department year section"
            })
            .populate({
                path: "event",
                select:
                    "title category venue date time"
            })
            .sort({
                createdAt: 1
            });

        return res.status(200).json({
            success: true,
            count: registrations.length,
            registrations
        });

    } catch (error) {
        console.error(
            "GET SEAT REGISTRATIONS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// ASSIGN OR UPDATE ONE SEAT
// ADMIN + COORDINATOR
// ==========================================
const assignSeat = async (req, res) => {
    try {
        const { registrationId } = req.params;

        const seatNumber =
            req.body.seatNumber?.trim().toUpperCase();

        if (!seatNumber) {
            return res.status(400).json({
                success: false,
                message: "Seat number is required"
            });
        }

        const registration =
            await Registration.findById(
                registrationId
            );

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        const duplicateSeat =
            await Registration.findOne({
                _id: {
                    $ne: registrationId
                },
                event: registration.event,
                seatNumber
            });

        if (duplicateSeat) {
            return res.status(400).json({
                success: false,
                message:
                    `Seat ${seatNumber} is already assigned`
            });
        }

        registration.seatNumber = seatNumber;
        registration.seatAssignedBy = req.user._id;
        registration.seatAssignedAt = new Date();

        await registration.save();

        return res.status(200).json({
            success: true,
            message:
                `Seat ${seatNumber} assigned successfully`,
            registration
        });

    } catch (error) {
        console.error(
            "ASSIGN SEAT ERROR:",
            error
        );

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message:
                    "This seat is already assigned to another student"
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// CLEAR ALL SEATS FOR ONE EVENT
// ADMIN + COORDINATOR
// ==========================================
const clearEventSeats = async (req, res) => {
    try {
        const result =
            await Registration.updateMany(
                {
                    event: req.params.eventId
                },
                {
                    $set: {
                        seatNumber: null,
                        seatAssignedBy: null,
                        seatAssignedAt: null
                    }
                }
            );

        return res.status(200).json({
            success: true,
            message:
                "All seat assignments cleared successfully",
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error(
            "CLEAR EVENT SEATS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// ==========================================
// UPDATE REGISTRATION STATUS
// ADMIN + COORDINATOR
// ==========================================
const updateRegistrationStatus = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "Registered",
            "Approved",
            "Pending",
            "Cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid registration status"
            });
        }

        const registration = await Registration.findById(
            registrationId
        );

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        registration.status = status;

        await registration.save();

        // Keep Event participants synchronized
        if (status === "Cancelled") {
            await Event.findByIdAndUpdate(
                registration.event,
                {
                    $pull: {
                        participants: registration.student
                    }
                }
            );
        } else {
            await Event.findByIdAndUpdate(
                registration.event,
                {
                    $addToSet: {
                        participants: registration.student
                    }
                }
            );
        }

        return res.status(200).json({
            success: true,
            message: `Registration status updated to ${status}`,
            registration
        });

    } catch (error) {
        console.error(
            "UPDATE REGISTRATION STATUS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// DELETE REGISTRATION PERMANENTLY
// ADMIN ONLY
// ==========================================
const deleteRegistration = async (req, res) => {
    try {
        const { registrationId } = req.params;

        const registration =
            await Registration.findById(
                registrationId
            );

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        await Event.findByIdAndUpdate(
            registration.event,
            {
                $pull: {
                    participants: registration.student
                }
            }
        );

        await Registration.findByIdAndDelete(
            registrationId
        );

        return res.status(200).json({
            success: true,
            message:
                "Registration deleted permanently"
        });

    } catch (error) {
        console.error(
            "DELETE REGISTRATION ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    registerForEvent,
    getMyRegistrations,
    getMyRegistrationById,
    getAllRegistrations,

    getEventRegistrationsForSeats,
    assignSeat,
    clearEventSeats,

    cancelRegistration,

    updateRegistrationStatus,
    deleteRegistration
};