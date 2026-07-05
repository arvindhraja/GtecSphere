const Certificate = require("../models/Certificate");
const Attendance = require("../models/Attendance");
const Event = require("../models/Event");
const Notification = require("../models/NotificationModel");


// ==========================================
// GENERATE UNIQUE CERTIFICATE NUMBER
// ==========================================
const generateCertificateNumber = (
    eventId,
    studentId
) => {
    const timestamp = Date.now();

    const eventCode = eventId
        .toString()
        .slice(-4)
        .toUpperCase();

    const studentCode = studentId
        .toString()
        .slice(-6)
        .toUpperCase();

    return (
        `GTEC-${eventCode}-${studentCode}-${timestamp}`
    );
};


// ==========================================
// GET ELIGIBLE STUDENTS FOR ONE EVENT
// ONLY STUDENTS MARKED PRESENT
// ADMIN + COORDINATOR
//
// GET
// /api/certificates/event/:eventId/eligible
// ==========================================
const getEligibleStudents = async (
    req,
    res
) => {
    try {
        const { eventId } = req.params;

        // ==========================================
        // CHECK EVENT
        // ==========================================
        const event = await Event.findById(
            eventId
        ).select(
            "title description category venue date time status publicationStatus"
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // ==========================================
        // GET PRESENT STUDENTS
        // ==========================================
        const attendanceRecords =
            await Attendance.find({
                event: eventId,
                status: "Present"
            })
                .populate(
                    "student",
                    "fullName registerNumber email department year section"
                )
                .sort({
                    markedAt: 1
                });

        // ==========================================
        // GET EXISTING CERTIFICATES
        // ==========================================
        const certificates =
            await Certificate.find({
                event: eventId
            })
                .populate(
                    "issuedBy",
                    "fullName email role"
                );

        // ==========================================
        // CERTIFICATE MAP
        // ==========================================
        const certificateMap = new Map();

        certificates.forEach(
            (certificate) => {
                certificateMap.set(
                    certificate.student.toString(),
                    certificate
                );
            }
        );

        // ==========================================
        // MERGE ATTENDANCE + CERTIFICATE
        // ==========================================
        const students =
            attendanceRecords
                .filter(
                    (attendance) =>
                        attendance.student
                )
                .map((attendance) => {
                    const studentId =
                        attendance.student._id.toString();

                    const certificate =
                        certificateMap.get(
                            studentId
                        );

                    return {
                        student:
                            attendance.student,

                        attendanceId:
                            attendance._id,

                        attendanceStatus:
                            attendance.status,

                        markedAt:
                            attendance.markedAt,

                        certificateId:
                            certificate?._id ||
                            null,

                        certificateNumber:
                            certificate
                                ?.certificateNumber ||
                            null,

                        certificateStatus:
                            certificate?.status ||
                            "Not Issued",

                        issuedAt:
                            certificate?.issuedAt ||
                            null,

                        issuedBy:
                            certificate?.issuedBy ||
                            null
                    };
                });

        // ==========================================
        // SUMMARY
        // ==========================================
        const totalEligible =
            students.length;

        const issued =
            students.filter(
                (item) =>
                    item.certificateStatus ===
                    "Issued"
            ).length;

        const revoked =
            students.filter(
                (item) =>
                    item.certificateStatus ===
                    "Revoked"
            ).length;

        const notIssued =
            students.filter(
                (item) =>
                    item.certificateStatus ===
                    "Not Issued"
            ).length;

        return res.status(200).json({
            success: true,

            event,

            summary: {
                totalEligible,
                issued,
                revoked,
                notIssued
            },

            students
        });

    } catch (error) {
        console.error(
            "GET ELIGIBLE STUDENTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// ISSUE ONE CERTIFICATE
// ADMIN + COORDINATOR
//
// POST /api/certificates/issue
// ==========================================
const issueCertificate = async (
    req,
    res
) => {
    try {
        const {
            eventId,
            studentId
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

        // ==========================================
        // CHECK EVENT
        // SHARED ADMIN + COORDINATOR ACCESS
        // ==========================================
        const event = await Event.findById(
            eventId
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // ==========================================
        // CHECK PRESENT ATTENDANCE
        // ==========================================
        const attendance =
            await Attendance.findOne({
                event: eventId,
                student: studentId,
                status: "Present"
            });

        if (!attendance) {
            return res.status(400).json({
                success: false,
                message:
                    "Certificate can only be issued to students marked Present"
            });
        }

        // ==========================================
        // CHECK EXISTING CERTIFICATE
        // ==========================================
        const existingCertificate =
            await Certificate.findOne({
                event: eventId,
                student: studentId
            });

        if (existingCertificate) {
            return res.status(400).json({
                success: false,

                message:
                    existingCertificate.status ===
                    "Revoked"
                        ? "A revoked certificate already exists for this student"
                        : "Certificate already issued for this event",

                certificate:
                    existingCertificate
            });
        }

        // ==========================================
        // GENERATE CERTIFICATE NUMBER
        // ==========================================
        const certificateNumber =
            generateCertificateNumber(
                eventId,
                studentId
            );

        // ==========================================
        // CREATE CERTIFICATE
        // ==========================================
        const certificate =
            await Certificate.create({
                student: studentId,
                event: eventId,
                attendance:
                    attendance._id,
                certificateNumber,
                issuedBy:
                    req.user._id,
                issuedAt:
                    new Date(),
                status: "Issued"
            });

        // ==========================================
        // POPULATE
        // ==========================================
        await certificate.populate([
            {
                path: "student",
                select:
                    "fullName registerNumber email department year section"
            },
            {
                path: "event",
                select:
                    "title description category venue date time status"
            },
            {
                path: "attendance",
                select:
                    "status markedAt"
            },
            {
                path: "issuedBy",
                select:
                    "fullName email role"
            }
        ]);

        // ==========================================
        // NOTIFICATION
        // ==========================================
        await Notification.create({
            user: studentId,

            title:
                "🏆 Certificate Issued",

            message:
                `Your certificate for "${event.title}" has been issued successfully.`,

            type: "Certificate",

            relatedEvent:
                eventId,

            isRead: false
        });

        return res.status(201).json({
            success: true,
            message:
                "Certificate issued successfully",
            certificate
        });

    } catch (error) {
        console.error(
            "ISSUE CERTIFICATE ERROR:",
            error
        );

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message:
                    "Certificate already issued for this event"
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// ISSUE ALL ELIGIBLE CERTIFICATES
// ADMIN + COORDINATOR
//
// POST
// /api/certificates/event/:eventId/issue-all
// ==========================================
const issueAllCertificates = async (
    req,
    res
) => {
    try {
        const { eventId } = req.params;

        // ==========================================
        // CHECK EVENT
        // ==========================================
        const event = await Event.findById(
            eventId
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // ==========================================
        // GET PRESENT ATTENDANCE
        // ==========================================
        const attendanceRecords =
            await Attendance.find({
                event: eventId,
                status: "Present"
            });

        if (
            attendanceRecords.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "No eligible Present students found"
            });
        }

        // ==========================================
        // GET EXISTING CERTIFICATES
        // ==========================================
        const existingCertificates =
            await Certificate.find({
                event: eventId
            }).select("student");

        const existingStudentIds =
            new Set(
                existingCertificates.map(
                    (certificate) =>
                        certificate.student.toString()
                )
            );

        // ==========================================
        // ONLY STUDENTS WITHOUT CERTIFICATE
        // ==========================================
        const eligibleAttendance =
            attendanceRecords.filter(
                (attendance) =>
                    !existingStudentIds.has(
                        attendance.student.toString()
                    )
            );

        if (
            eligibleAttendance.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "All eligible students already have certificates"
            });
        }

        // ==========================================
        // CREATE CERTIFICATES
        // ==========================================
        const certificateDocuments =
            eligibleAttendance.map(
                (attendance, index) => ({
                    student:
                        attendance.student,

                    event:
                        eventId,

                    attendance:
                        attendance._id,

                    certificateNumber:
                        `${generateCertificateNumber(
                            eventId,
                            attendance.student
                        )}-${index + 1}`,

                    issuedBy:
                        req.user._id,

                    issuedAt:
                        new Date(),

                    status:
                        "Issued"
                })
            );

        const certificates =
            await Certificate.insertMany(
                certificateDocuments
            );

        // ==========================================
        // CREATE NOTIFICATIONS
        // ==========================================
        const notifications =
            eligibleAttendance.map(
                (attendance) => ({
                    user:
                        attendance.student,

                    title:
                        "🏆 Certificate Issued",

                    message:
                        `Your certificate for "${event.title}" has been issued successfully.`,

                    type:
                        "Certificate",

                    relatedEvent:
                        eventId,

                    isRead:
                        false
                })
            );

        await Notification.insertMany(
            notifications
        );

        return res.status(201).json({
            success: true,

            message:
                `${certificates.length} certificate${
                    certificates.length !== 1
                        ? "s"
                        : ""
                } issued successfully`,

            summary: {
                issued:
                    certificates.length,

                skipped:
                    attendanceRecords.length -
                    eligibleAttendance.length
            }
        });

    } catch (error) {
        console.error(
            "ISSUE ALL CERTIFICATES ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET ALL CERTIFICATES FOR ONE EVENT
// ADMIN + COORDINATOR
//
// GET
// /api/certificates/event/:eventId
// ==========================================
const getEventCertificates = async (
    req,
    res
) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(
            eventId
        ).select(
            "title category venue date time status"
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        const certificates =
            await Certificate.find({
                event: eventId
            })
                .populate(
                    "student",
                    "fullName registerNumber email department year section"
                )
                .populate(
                    "attendance",
                    "status markedAt"
                )
                .populate(
                    "issuedBy",
                    "fullName email role"
                )
                .sort({
                    issuedAt: -1,
                    createdAt: -1
                });

        const issued =
            certificates.filter(
                (certificate) =>
                    certificate.status ===
                    "Issued"
            ).length;

        const revoked =
            certificates.filter(
                (certificate) =>
                    certificate.status ===
                    "Revoked"
            ).length;

        return res.status(200).json({
            success: true,

            event,

            summary: {
                totalCertificates:
                    certificates.length,
                issued,
                revoked
            },

            certificates
        });

    } catch (error) {
        console.error(
            "GET EVENT CERTIFICATES ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET ALL CERTIFICATES
// ADMIN + COORDINATOR
//
// GET /api/certificates/manage/all
// ==========================================
const getAllCertificates = async (
    req,
    res
) => {
    try {
        const certificates =
            await Certificate.find()
                .populate(
                    "student",
                    "fullName registerNumber email department year section"
                )
                .populate(
                    "event",
                    "title category venue date time status"
                )
                .populate(
                    "attendance",
                    "status markedAt"
                )
                .populate(
                    "issuedBy",
                    "fullName email role"
                )
                .sort({
                    issuedAt: -1,
                    createdAt: -1
                });

        const issued =
            certificates.filter(
                (certificate) =>
                    certificate.status ===
                    "Issued"
            ).length;

        const revoked =
            certificates.filter(
                (certificate) =>
                    certificate.status ===
                    "Revoked"
            ).length;

        return res.status(200).json({
            success: true,

            summary: {
                totalCertificates:
                    certificates.length,
                issued,
                revoked
            },

            certificates
        });

    } catch (error) {
        console.error(
            "GET ALL CERTIFICATES ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET MY CERTIFICATES
// STUDENT ONLY
//
// GET /api/certificates/my-certificates
// ==========================================
const getMyCertificates = async (
    req,
    res
) => {
    try {
        const certificates =
            await Certificate.find({
                student:
                    req.user._id
            })
                .populate({
                    path: "event",
                    select:
                        "title description category venue date time organizer status",

                    populate: {
                        path: "organizer",
                        select:
                            "fullName email"
                    }
                })
                .populate(
                    "attendance",
                    "status markedAt"
                )
                .populate(
                    "issuedBy",
                    "fullName email role"
                )
                .sort({
                    issuedAt: -1,
                    createdAt: -1
                });

        const issued =
            certificates.filter(
                (certificate) =>
                    certificate.status ===
                    "Issued"
            ).length;

        const revoked =
            certificates.filter(
                (certificate) =>
                    certificate.status ===
                    "Revoked"
            ).length;

        return res.status(200).json({
            success: true,

            summary: {
                totalCertificates:
                    certificates.length,
                issued,
                revoked
            },

            certificates
        });

    } catch (error) {
        console.error(
            "GET MY CERTIFICATES ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET SINGLE CERTIFICATE
// STUDENT / COORDINATOR / ADMIN
//
// GET /api/certificates/:certificateId
// ==========================================
const getCertificateById = async (
    req,
    res
) => {
    try {
        const { certificateId } =
            req.params;

        const certificate =
            await Certificate.findById(
                certificateId
            )
                .populate(
                    "student",
                    "fullName registerNumber email department year section"
                )
                .populate({
                    path: "event",
                    select:
                        "title description category venue date time organizer status",

                    populate: {
                        path: "organizer",
                        select:
                            "fullName email"
                    }
                })
                .populate(
                    "attendance",
                    "status markedAt"
                )
                .populate(
                    "issuedBy",
                    "fullName email role"
                );

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message:
                    "Certificate not found"
            });
        }

        // ==========================================
        // STUDENT CAN ONLY VIEW OWN CERTIFICATE
        // ADMIN + COORDINATOR CAN VIEW ALL
        // ==========================================
        if (
            req.user.role ===
                "student" &&
            certificate.student._id.toString() !==
                req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to view this certificate"
            });
        }

        return res.status(200).json({
            success: true,
            certificate
        });

    } catch (error) {
        console.error(
            "GET CERTIFICATE BY ID ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// VERIFY CERTIFICATE
// PUBLIC ACCESS
//
// GET
// /api/certificates/verify/:certificateNumber
// ==========================================
const verifyCertificate = async (
    req,
    res
) => {
    try {
        const { certificateNumber } =
            req.params;

        const certificate =
            await Certificate.findOne({
                certificateNumber:
                    certificateNumber
                        .trim()
                        .toUpperCase()
            })
                .populate(
                    "student",
                    "fullName registerNumber department year section"
                )
                .populate({
                    path: "event",
                    select:
                        "title category venue date time organizer status",

                    populate: {
                        path: "organizer",
                        select:
                            "fullName"
                    }
                })
                .populate(
                    "issuedBy",
                    "fullName role"
                );

        if (!certificate) {
            return res.status(404).json({
                success: false,
                valid: false,
                message:
                    "Invalid certificate"
            });
        }

        if (
            certificate.status ===
            "Revoked"
        ) {
            return res.status(200).json({
                success: true,
                valid: false,
                message:
                    "Certificate has been revoked",
                certificate
            });
        }

        return res.status(200).json({
            success: true,
            valid: true,
            message:
                "Certificate is valid",
            certificate
        });

    } catch (error) {
        console.error(
            "VERIFY CERTIFICATE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            valid: false,
            message: error.message
        });
    }
};


// ==========================================
// REVOKE CERTIFICATE
// ADMIN + COORDINATOR
//
// PATCH
// /api/certificates/:certificateId/revoke
// ==========================================
const revokeCertificate = async (
    req,
    res
) => {
    try {
        const { certificateId } =
            req.params;

        const certificate =
            await Certificate.findById(
                certificateId
            ).populate(
                "event",
                "title"
            );

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message:
                    "Certificate not found"
            });
        }

        if (
            certificate.status ===
            "Revoked"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Certificate is already revoked"
            });
        }

        certificate.status =
            "Revoked";

        await certificate.save();

        // ==========================================
        // NOTIFICATION
        // ==========================================
        await Notification.create({
            user:
                certificate.student,

            title:
                "❌ Certificate Revoked",

            message:
                `Your certificate for "${certificate.event.title}" has been revoked.`,

            type:
                "Certificate",

            relatedEvent:
                certificate.event._id,

            isRead:
                false
        });

        await certificate.populate([
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
                path: "attendance",
                select:
                    "status markedAt"
            },
            {
                path: "issuedBy",
                select:
                    "fullName email role"
            }
        ]);

        return res.status(200).json({
            success: true,
            message:
                "Certificate revoked successfully",
            certificate
        });

    } catch (error) {
        console.error(
            "REVOKE CERTIFICATE ERROR:",
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
    getEligibleStudents,
    issueCertificate,
    issueAllCertificates,
    getEventCertificates,
    getAllCertificates,
    getMyCertificates,
    getCertificateById,
    verifyCertificate,
    revokeCertificate
};