const Attendance = require("../models/Attendance");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const Notification = require("../models/NotificationModel");


// ==========================================
// VALID ATTENDANCE STATUSES
// ==========================================
const allowedStatuses = [
    "Present",
    "Absent"
];


// ==========================================
// CHECK EVENT EXISTS
// ADMIN + COORDINATOR CAN ACCESS
// ==========================================
const findEvent = async (eventId) => {
    return await Event.findById(eventId)
        .select(
            "title description category venue date time status publicationStatus maxParticipants"
        );
};


// ==========================================
// MARK ATTENDANCE
// ADMIN + COORDINATOR
//
// POST /api/attendance/mark
// ==========================================
const markAttendance = async (req, res) => {
    try {
        const {
            eventId,
            studentId,
            status
        } = req.body;

        // ==========================================
        // VALIDATION
        // ==========================================
        if (!eventId || !studentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Event ID and Student ID are required"
            });
        }

        const attendanceStatus =
            status || "Present";

        if (
            !allowedStatuses.includes(
                attendanceStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be Present or Absent"
            });
        }

        // ==========================================
        // CHECK EVENT
        // ==========================================
        const event = await findEvent(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // ==========================================
        // CHECK STUDENT REGISTRATION
        // ==========================================
        const registration =
            await Registration.findOne({
                event: eventId,
                student: studentId,
                status: {
                    $ne: "Cancelled"
                }
            });

        if (!registration) {
            return res.status(400).json({
                success: false,
                message:
                    "Student is not actively registered for this event"
            });
        }

        // ==========================================
        // CREATE OR UPDATE ATTENDANCE
        // ==========================================
        let attendance =
            await Attendance.findOne({
                event: eventId,
                student: studentId
            });

        const previousStatus =
            attendance?.status || null;

        if (attendance) {
            attendance.status =
                attendanceStatus;

            attendance.markedBy =
                req.user._id;

            attendance.markedAt =
                new Date();

            await attendance.save();
        } else {
            attendance =
                await Attendance.create({
                    event: eventId,
                    student: studentId,
                    status:
                        attendanceStatus,
                    markedBy:
                        req.user._id,
                    markedAt:
                        new Date()
                });
        }

        // ==========================================
        // CREATE NOTIFICATION
        // ONLY WHEN NEW OR STATUS CHANGED
        // ==========================================
        if (
            !previousStatus ||
            previousStatus !==
                attendanceStatus
        ) {
            await Notification.create({
                user: studentId,

                title:
                    attendanceStatus ===
                    "Present"
                        ? "✅ Attendance Marked Present"
                        : "❌ Attendance Marked Absent",

                message:
                    `Your attendance for "${event.title}" has been marked as ${attendanceStatus}.`,

                type: "Attendance",

                relatedEvent: eventId,

                isRead: false
            });
        }

        // ==========================================
        // POPULATE RESULT
        // ==========================================
        await attendance.populate([
            {
                path: "student",
                select:
                    "fullName registerNumber email department year section"
            },
            {
                path: "event",
                select:
                    "title category venue date time status"
            },
            {
                path: "markedBy",
                select:
                    "fullName email role"
            }
        ]);

        return res.status(200).json({
            success: true,

            message:
                previousStatus
                    ? `Attendance updated to ${attendanceStatus} successfully`
                    : `Attendance marked as ${attendanceStatus} successfully`,

            attendance
        });

    } catch (error) {
        console.error(
            "MARK ATTENDANCE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET EVENT ATTENDANCE
// RETURNS ALL REGISTERED STUDENTS
// INCLUDING NOT MARKED STUDENTS
// ADMIN + COORDINATOR
//
// GET /api/attendance/event/:eventId
// ==========================================
const getEventAttendance = async (
    req,
    res
) => {
    try {
        const { eventId } = req.params;

        // ==========================================
        // CHECK EVENT
        // ==========================================
        const event = await findEvent(
            eventId
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // ==========================================
        // GET ACTIVE REGISTRATIONS
        // ==========================================
        const registrations =
            await Registration.find({
                event: eventId,
                status: {
                    $ne: "Cancelled"
                }
            })
                .populate({
                    path: "student",
                    select:
                        "fullName registerNumber email department year section"
                })
                .sort({
                    createdAt: 1
                });

        // ==========================================
        // GET SAVED ATTENDANCE
        // ==========================================
        const attendanceRecords =
            await Attendance.find({
                event: eventId
            })
                .populate({
                    path: "student",
                    select:
                        "fullName registerNumber email department year section"
                })
                .populate({
                    path: "markedBy",
                    select:
                        "fullName email role"
                });

        // ==========================================
        // CREATE ATTENDANCE MAP
        // ==========================================
        const attendanceMap =
            new Map();

        attendanceRecords.forEach(
            (attendance) => {
                if (attendance.student) {
                    attendanceMap.set(
                        attendance.student._id.toString(),
                        attendance
                    );
                }
            }
        );

        // ==========================================
        // MERGE REGISTRATIONS + ATTENDANCE
        // ==========================================
        const students =
            registrations
                .filter(
                    (registration) =>
                        registration.student
                )
                .map((registration) => {
                    const studentId =
                        registration.student._id.toString();

                    const attendance =
                        attendanceMap.get(
                            studentId
                        );

                    return {
                        registrationId:
                            registration._id,

                        student:
                            registration.student,

                        seatNumber:
                            registration.seatNumber ||
                            null,

                        registrationStatus:
                            registration.status,

                        attendanceId:
                            attendance?._id ||
                            null,

                        attendanceStatus:
                            attendance?.status ||
                            "Not Marked",

                        status:
                            attendance?.status ||
                            "Not Marked",

                        markedBy:
                            attendance?.markedBy ||
                            null,

                        markedAt:
                            attendance?.markedAt ||
                            null
                    };
                });

        // ==========================================
        // SUMMARY
        // ==========================================
        const totalRegistered =
            students.length;

        const presentCount =
            students.filter(
                (item) =>
                    item.attendanceStatus ===
                    "Present"
            ).length;

        const absentCount =
            students.filter(
                (item) =>
                    item.attendanceStatus ===
                    "Absent"
            ).length;

        const notMarkedCount =
            students.filter(
                (item) =>
                    item.attendanceStatus ===
                    "Not Marked"
            ).length;

        const attendanceMarked =
            presentCount + absentCount;

        return res.status(200).json({
            success: true,

            event,

            summary: {
                totalRegistered,
                attendanceMarked,
                present: presentCount,
                absent: absentCount,
                notMarked:
                    notMarkedCount
            },

            students,

            // Keep this for compatibility
            // with older frontend code
            attendance:
                attendanceRecords
        });

    } catch (error) {
        console.error(
            "GET EVENT ATTENDANCE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// UPDATE ATTENDANCE
// ADMIN + COORDINATOR
//
// PATCH
// /api/attendance/event/:eventId/student/:studentId
// ==========================================
const updateAttendance = async (
    req,
    res
) => {
    try {
        const {
            eventId,
            studentId
        } = req.params;

        const { status } = req.body;

        // ==========================================
        // VALIDATION
        // ==========================================
        if (!status) {
            return res.status(400).json({
                success: false,
                message:
                    "Attendance status is required"
            });
        }

        if (
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be Present or Absent"
            });
        }

        // ==========================================
        // CHECK EVENT
        // ==========================================
        const event = await findEvent(
            eventId
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // ==========================================
        // CHECK REGISTRATION
        // ==========================================
        const registration =
            await Registration.findOne({
                event: eventId,
                student: studentId,
                status: {
                    $ne: "Cancelled"
                }
            });

        if (!registration) {
            return res.status(400).json({
                success: false,
                message:
                    "Student is not actively registered for this event"
            });
        }

        // ==========================================
        // UPSERT ATTENDANCE
        // CREATES IF NOT MARKED YET
        // ==========================================
        const previousAttendance =
            await Attendance.findOne({
                event: eventId,
                student: studentId
            });

        const previousStatus =
            previousAttendance?.status ||
            null;

        const attendance =
            await Attendance.findOneAndUpdate(
                {
                    event: eventId,
                    student: studentId
                },
                {
                    $set: {
                        status,
                        markedBy:
                            req.user._id,
                        markedAt:
                            new Date()
                    }
                },
                {
                    new: true,
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true
                }
            );

        // ==========================================
        // NOTIFICATION
        // ==========================================
        if (
            !previousStatus ||
            previousStatus !== status
        ) {
            await Notification.create({
                user: studentId,

                title:
                    status === "Present"
                        ? "✅ Attendance Marked Present"
                        : "❌ Attendance Marked Absent",

                message:
                    `Your attendance for "${event.title}" has been marked as ${status}.`,

                type: "Attendance",

                relatedEvent: eventId,

                isRead: false
            });
        }

        await attendance.populate([
            {
                path: "student",
                select:
                    "fullName registerNumber email department year section"
            },
            {
                path: "event",
                select:
                    "title category venue date time status"
            },
            {
                path: "markedBy",
                select:
                    "fullName email role"
            }
        ]);

        return res.status(200).json({
            success: true,

            message:
                `Attendance updated to ${status} successfully`,

            attendance
        });

    } catch (error) {
        console.error(
            "UPDATE ATTENDANCE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// DELETE / RESET ATTENDANCE
// ADMIN + COORDINATOR
//
// DELETE
// /api/attendance/event/:eventId/student/:studentId
// ==========================================
const deleteAttendance = async (
    req,
    res
) => {
    try {
        const {
            eventId,
            studentId
        } = req.params;

        // ==========================================
        // CHECK EVENT
        // ==========================================
        const event = await findEvent(
            eventId
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // ==========================================
        // FIND ATTENDANCE
        // ==========================================
        const attendance =
            await Attendance.findOne({
                event: eventId,
                student: studentId
            });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance is already not marked"
            });
        }

        await attendance.deleteOne();

        return res.status(200).json({
            success: true,
            message:
                "Attendance reset successfully"
        });

    } catch (error) {
        console.error(
            "DELETE ATTENDANCE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// MARK ALL REGISTERED STUDENTS PRESENT
// ADMIN + COORDINATOR
//
// POST /api/attendance/event/:eventId/mark-all-present
// ==========================================
const markAllPresent = async (
    req,
    res
) => {
    try {
        const { eventId } = req.params;

        // ==========================================
        // CHECK EVENT
        // ==========================================
        const event = await findEvent(
            eventId
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // ==========================================
        // GET ACTIVE REGISTRATIONS
        // ==========================================
        const registrations =
            await Registration.find({
                event: eventId,
                status: {
                    $ne: "Cancelled"
                }
            }).select("student");

        if (
            registrations.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "No registered students found for this event"
            });
        }

        const now = new Date();

        // ==========================================
        // BULK UPSERT
        // ==========================================
        const operations =
            registrations.map(
                (registration) => ({
                    updateOne: {
                        filter: {
                            event: eventId,
                            student:
                                registration.student
                        },

                        update: {
                            $set: {
                                status: "Present",
                                markedBy:
                                    req.user._id,
                                markedAt: now
                            }
                        },

                        upsert: true
                    }
                })
            );

        await Attendance.bulkWrite(
            operations
        );

        return res.status(200).json({
            success: true,

            message:
                "All registered students marked Present successfully",

            summary: {
                totalMarked:
                    registrations.length
            }
        });

    } catch (error) {
        console.error(
            "MARK ALL PRESENT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// RESET ALL ATTENDANCE FOR EVENT
// ADMIN + COORDINATOR
//
// DELETE /api/attendance/event/:eventId/reset-all
// ==========================================
const resetAllAttendance = async (
    req,
    res
) => {
    try {
        const { eventId } = req.params;

        // ==========================================
        // CHECK EVENT
        // ==========================================
        const event = await findEvent(
            eventId
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // ==========================================
        // DELETE ALL EVENT ATTENDANCE
        // ==========================================
        const result =
            await Attendance.deleteMany({
                event: eventId
            });

        return res.status(200).json({
            success: true,

            message:
                "All attendance records reset successfully",

            summary: {
                deletedRecords:
                    result.deletedCount
            }
        });

    } catch (error) {
        console.error(
            "RESET ALL ATTENDANCE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET MY ATTENDANCE HISTORY
// STUDENT ONLY
//
// GET /api/attendance/my-attendance
// ==========================================
const getMyAttendance = async (
    req,
    res
) => {
    try {
        const attendanceRecords =
            await Attendance.find({
                student: req.user._id
            })
                .populate({
                    path: "event",

                    select:
                        "title description category venue date time status organizer",

                    populate: {
                        path: "organizer",
                        select:
                            "fullName email"
                    }
                })
                .populate(
                    "markedBy",
                    "fullName email role"
                )
                .sort({
                    markedAt: -1
                });

        // ==========================================
        // REMOVE DELETED EVENTS
        // ==========================================
        const validAttendanceRecords =
            attendanceRecords.filter(
                (attendance) =>
                    attendance.event
            );

        // ==========================================
        // SUMMARY
        // ==========================================
        const totalAttendance =
            validAttendanceRecords.length;

        const presentCount =
            validAttendanceRecords.filter(
                (attendance) =>
                    attendance.status ===
                    "Present"
            ).length;

        const absentCount =
            validAttendanceRecords.filter(
                (attendance) =>
                    attendance.status ===
                    "Absent"
            ).length;

        const attendancePercentage =
            totalAttendance > 0
                ? Number(
                      (
                          (
                              presentCount /
                              totalAttendance
                          ) *
                          100
                      ).toFixed(2)
                  )
                : 0;

        return res.status(200).json({
            success: true,

            summary: {
                totalAttendance,
                present: presentCount,
                absent: absentCount,
                attendancePercentage
            },

            attendance:
                validAttendanceRecords
        });

    } catch (error) {
        console.error(
            "GET MY ATTENDANCE ERROR:",
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
    markAttendance,
    getEventAttendance,
    updateAttendance,
    deleteAttendance,
    markAllPresent,
    resetAllAttendance,
    getMyAttendance
};