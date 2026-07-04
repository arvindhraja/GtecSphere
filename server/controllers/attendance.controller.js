const Attendance = require("../models/Attendance");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const Notification = require("../models/NotificationModel");


// ==========================================
// MARK ATTENDANCE
// COORDINATOR ONLY
// ==========================================
const markAttendance = async (req, res) => {
    try {
        const {
            eventId,
            studentId,
            status
        } = req.body;

        if (!eventId || !studentId) {
            return res.status(400).json({
                success: false,
                message: "Event ID and Student ID are required"
            });
        }

        const attendanceStatus = status || "Present";

        const allowedStatuses = [
            "Present",
            "Absent"
        ];

        if (!allowedStatuses.includes(attendanceStatus)) {
            return res.status(400).json({
                success: false,
                message: "Status must be Present or Absent"
            });
        }

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

        const registration = await Registration.findOne({
            event: eventId,
            student: studentId
        });

        if (!registration) {
            return res.status(400).json({
                success: false,
                message:
                    "Student is not registered for this event"
            });
        }

        const existingAttendance =
            await Attendance.findOne({
                event: eventId,
                student: studentId
            });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: "Attendance already marked"
            });
        }

        const attendance = await Attendance.create({
            event: eventId,
            student: studentId,
            status: attendanceStatus,
            markedBy: req.user._id
        });

        // ==========================================
        // CREATE ATTENDANCE NOTIFICATION
        // ==========================================
        await Notification.create({
            user: studentId,
            title:
                attendanceStatus === "Present"
                    ? "✅ Attendance Marked Present"
                    : "❌ Attendance Marked Absent",
            message:
                `Your attendance for "${event.title}" has been marked as ${attendanceStatus}.`,
            type: "Attendance",
            relatedEvent: eventId,
            isRead: false
        });

        await attendance.populate([
            {
                path: "student",
                select:
                    "fullName registerNumber email department year section"
            },
            {
                path: "event",
                select:
                    "title venue date time"
            },
            {
                path: "markedBy",
                select:
                    "fullName email role"
            }
        ]);

        return res.status(201).json({
            success: true,
            message:
                `Attendance marked as ${attendanceStatus} successfully`,
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
// GET EVENT ATTENDANCE LIST
// COORDINATOR ONLY
// ==========================================
const getEventAttendance = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findOne({
            _id: eventId,
            organizer: req.user._id
        }).select(
            "title description category venue date time status maxParticipants"
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message:
                    "Event not found or you are not the organizer"
            });
        }

        const attendanceRecords = await Attendance.find({
            event: eventId
        })
            .populate(
                "student",
                "fullName registerNumber email department year section"
            )
            .populate(
                "markedBy",
                "fullName email role"
            )
            .sort({
                markedAt: -1
            });

        const totalRegistered =
            await Registration.countDocuments({
                event: eventId
            });

        const presentCount =
            attendanceRecords.filter(
                (attendance) =>
                    attendance.status === "Present"
            ).length;

        const absentCount =
            attendanceRecords.filter(
                (attendance) =>
                    attendance.status === "Absent"
            ).length;

        const attendanceMarked =
            attendanceRecords.length;

        const notMarkedCount =
            totalRegistered - attendanceMarked;

        return res.status(200).json({
            success: true,

            event,

            summary: {
                totalRegistered,
                attendanceMarked,
                present: presentCount,
                absent: absentCount,
                notMarked:
                    Math.max(notMarkedCount, 0)
            },

            attendance: attendanceRecords
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
// COORDINATOR ONLY
// ==========================================
const updateAttendance = async (req, res) => {
    try {
        const {
            eventId,
            studentId
        } = req.params;

        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Attendance status is required"
            });
        }

        const allowedStatuses = [
            "Present",
            "Absent"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be Present or Absent"
            });
        }

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

        const attendance = await Attendance.findOne({
            event: eventId,
            student: studentId
        });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found"
            });
        }

        if (attendance.status === status) {
            return res.status(400).json({
                success: false,
                message:
                    `Attendance is already marked as ${status}`
            });
        }

        attendance.status = status;
        attendance.markedBy = req.user._id;
        attendance.markedAt = new Date();

        await attendance.save();

        // ==========================================
        // CREATE ATTENDANCE UPDATE NOTIFICATION
        // ==========================================
        await Notification.create({
            user: studentId,
            title: "🔄 Attendance Updated",
            message:
                `Your attendance for "${event.title}" has been updated to ${status}.`,
            type: "Attendance",
            relatedEvent: eventId,
            isRead: false
        });

        await attendance.populate([
            {
                path: "student",
                select:
                    "fullName registerNumber email department year section"
            },
            {
                path: "event",
                select:
                    "title venue date time"
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
// COORDINATOR ONLY
// ==========================================
const deleteAttendance = async (req, res) => {
    try {
        const {
            eventId,
            studentId
        } = req.params;

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

        const attendance = await Attendance.findOne({
            event: eventId,
            student: studentId
        });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found"
            });
        }

        await attendance.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Attendance reset successfully"
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
// GET MY ATTENDANCE HISTORY
// STUDENT ONLY
// ==========================================
const getMyAttendance = async (req, res) => {
    try {
        const attendanceRecords = await Attendance.find({
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
            .populate(
                "markedBy",
                "fullName email role"
            )
            .sort({
                markedAt: -1
            });

        const validAttendanceRecords =
            attendanceRecords.filter(
                (attendance) => attendance.event
            );

        const totalAttendance =
            validAttendanceRecords.length;

        const presentCount =
            validAttendanceRecords.filter(
                (attendance) =>
                    attendance.status === "Present"
            ).length;

        const absentCount =
            validAttendanceRecords.filter(
                (attendance) =>
                    attendance.status === "Absent"
            ).length;

        const attendancePercentage =
            totalAttendance > 0
                ? Number(
                    (
                        (presentCount / totalAttendance) *
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

            attendance: validAttendanceRecords
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
    getMyAttendance
};