const Certificate = require("../models/Certificate");
const Attendance = require("../models/Attendance");
const Event = require("../models/Event");
const Notification = require("../models/NotificationModel");


// ==========================================
// ISSUE CERTIFICATE
// COORDINATOR / ADMIN
// ==========================================
const issueCertificate = async (req, res) => {
    try {
        const {
            eventId,
            studentId
        } = req.body;

        if (!eventId || !studentId) {
            return res.status(400).json({
                success: false,
                message: "Event ID and Student ID are required"
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

        const existingCertificate =
            await Certificate.findOne({
                event: eventId,
                student: studentId
            });

        if (existingCertificate) {
            return res.status(400).json({
                success: false,
                message:
                    "Certificate already issued for this event"
            });
        }

        const certificateNumber =
            `GTEC-${Date.now()}-${studentId
                .toString()
                .slice(-6)
                .toUpperCase()}`;

        const certificate = await Certificate.create({
            student: studentId,
            event: eventId,
            attendance: attendance._id,
            certificateNumber,
            issuedBy: req.user._id
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
                path: "issuedBy",
                select:
                    "fullName email role"
            }
        ]);

        // ==========================================
        // CREATE CERTIFICATE ISSUED NOTIFICATION
        // ==========================================
        await Notification.create({
            user: studentId,
            title: "🏆 Certificate Issued",
            message:
                `Your certificate for "${certificate.event.title}" has been issued successfully.`,
            type: "Certificate",
            relatedEvent: eventId,
            isRead: false
        });

        return res.status(201).json({
            success: true,
            message: "Certificate issued successfully",
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
// GET MY CERTIFICATES
// STUDENT ONLY
// ==========================================
const getMyCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.find({
            student: req.user._id
        })
            .populate({
                path: "event",
                select:
                    "title description category venue date time organizer status",
                populate: {
                    path: "organizer",
                    select: "fullName email"
                }
            })
            .populate(
                "issuedBy",
                "fullName email role"
            )
            .sort({
                issuedAt: -1,
                createdAt: -1
            });

        return res.status(200).json({
            success: true,

            summary: {
                totalCertificates: certificates.length
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
// ==========================================
const getCertificateById = async (req, res) => {
    try {
        const { certificateId } = req.params;

        const certificate = await Certificate.findById(
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
                    select: "fullName email"
                }
            })
            .populate(
                "issuedBy",
                "fullName email role"
            );

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: "Certificate not found"
            });
        }

        if (
            req.user.role === "student" &&
            certificate.student._id.toString() !==
                req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to view this certificate"
            });
        }

        if (
            req.user.role === "coordinator" &&
            certificate.event.organizer._id.toString() !==
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
// ==========================================
const verifyCertificate = async (req, res) => {
    try {
        const { certificateNumber } = req.params;

        const certificate = await Certificate.findOne({
            certificateNumber
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
                    select: "fullName"
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
                message: "Invalid certificate"
            });
        }

        if (certificate.status === "Revoked") {
            return res.status(200).json({
                success: true,
                valid: false,
                message: "Certificate has been revoked",
                certificate
            });
        }

        return res.status(200).json({
            success: true,
            valid: true,
            message: "Certificate is valid",
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
// GET COORDINATOR CERTIFICATES
// COORDINATOR ONLY
// ==========================================
const getCoordinatorCertificates = async (req, res) => {
    try {
        const coordinatorEvents = await Event.find({
            organizer: req.user._id
        }).select("_id");

        const eventIds = coordinatorEvents.map(
            (event) => event._id
        );

        const certificates = await Certificate.find({
            event: {
                $in: eventIds
            }
        })
            .populate(
                "student",
                "fullName registerNumber email department year section"
            )
            .populate(
                "event",
                "title category venue date time status"
            )
            .populate(
                "issuedBy",
                "fullName email role"
            )
            .sort({
                issuedAt: -1,
                createdAt: -1
            });

        const issuedCount = certificates.filter(
            (certificate) =>
                certificate.status === "Issued"
        ).length;

        return res.status(200).json({
            success: true,

            summary: {
                totalEvents: eventIds.length,
                totalCertificates: certificates.length,
                issued: issuedCount
            },

            certificates
        });

    } catch (error) {
        console.error(
            "GET COORDINATOR CERTIFICATES ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// REVOKE CERTIFICATE
// COORDINATOR / ADMIN
// ==========================================
const revokeCertificate = async (req, res) => {
    try {
        const { certificateId } = req.params;

        const certificate = await Certificate.findById(
            certificateId
        ).populate(
            "event",
            "title organizer"
        );

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: "Certificate not found"
            });
        }

        if (
            req.user.role === "coordinator" &&
            certificate.event.organizer.toString() !==
                req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to revoke this certificate"
            });
        }

        if (certificate.status === "Revoked") {
            return res.status(400).json({
                success: false,
                message: "Certificate is already revoked"
            });
        }

        certificate.status = "Revoked";

        await certificate.save();

        // ==========================================
        // CREATE CERTIFICATE REVOKED NOTIFICATION
        // ==========================================
        await Notification.create({
            user: certificate.student,
            title: "❌ Certificate Revoked",
            message:
                `Your certificate for "${certificate.event.title}" has been revoked.`,
            type: "Certificate",
            relatedEvent: certificate.event._id,
            isRead: false
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
                    "title category venue date time organizer status"
            },
            {
                path: "issuedBy",
                select:
                    "fullName email role"
            }
        ]);

        return res.status(200).json({
            success: true,
            message: "Certificate revoked successfully",
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
    issueCertificate,
    getMyCertificates,
    getCertificateById,
    verifyCertificate,
    getCoordinatorCertificates,
    revokeCertificate
};