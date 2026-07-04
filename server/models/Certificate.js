const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        attendance: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Attendance",
            required: true
        },

        certificateNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        issuedAt: {
            type: Date,
            default: Date.now
        },

        status: {
            type: String,
            enum: [
                "Issued",
                "Revoked"
            ],
            default: "Issued"
        }
    },
    {
        timestamps: true
    }
);


// ==========================================
// PREVENT DUPLICATE CERTIFICATES
// ONE STUDENT + ONE EVENT = ONE CERTIFICATE
// ==========================================
certificateSchema.index(
    {
        student: 1,
        event: 1
    },
    {
        unique: true
    }
);


module.exports = mongoose.model(
    "Certificate",
    certificateSchema
);