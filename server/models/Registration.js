const mongoose = require("mongoose");


// ==========================================
// TEAM MEMBER SCHEMA
// ==========================================
const teamMemberSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        registerNumber: {
            type: String,
            required: true,
            trim: true
        },

        department: {
            type: String,
            default: "",
            trim: true
        },

        year: {
            type: String,
            default: "",
            trim: true
        },

        email: {
            type: String,
            default: "",
            trim: true,
            lowercase: true
        },

        phone: {
            type: String,
            default: "",
            trim: true
        }
    },
    {
        _id: true
    }
);


// ==========================================
// REGISTRATION SCHEMA
// ==========================================
const registrationSchema = new mongoose.Schema(
    {
        // STUDENT WHO SUBMITTED THE REGISTRATION
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // REGISTERED EVENT
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },


        // ==========================================
        // REGISTRATION TYPE
        // ==========================================
        registrationType: {
            type: String,
            enum: ["Individual", "Team"],
            default: "Individual"
        },


        // ==========================================
        // TEAM DETAILS
        // USED ONLY FOR TEAM REGISTRATION
        // ==========================================
        teamName: {
            type: String,
            default: "",
            trim: true
        },

        teamMembers: {
            type: [teamMemberSchema],
            default: []
        },


        // ==========================================
        // PROJECT / TOPIC DETAILS
        // ==========================================
        projectTitle: {
            type: String,
            default: "",
            trim: true
        },

        projectDescription: {
            type: String,
            default: "",
            trim: true
        },


        // ==========================================
        // ACKNOWLEDGEMENT
        // ==========================================
        acknowledgementNumber: {
            type: String,
            unique: true,
            sparse: true,
            trim: true
        },


        // ==========================================
        // REGISTRATION STATUS
        // ==========================================
        status: {
            type: String,
            enum: [
                "Pending",
                "Registered",
                "Approved",
                "Rejected",
                "Cancelled",
                "Attended"
            ],
            default: "Registered"
        },


        // ==========================================
        // APPROVAL DETAILS
        // ==========================================
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        reviewedAt: {
            type: Date,
            default: null
        },

        rejectionReason: {
            type: String,
            default: "",
            trim: true
        },


        // ==========================================
        // SEAT ASSIGNMENT
        // ==========================================
        seatNumber: {
            type: String,
            default: null,
            trim: true
        },

        seatAssignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        seatAssignedAt: {
            type: Date,
            default: null
        },


        // ==========================================
        // REGISTRATION DATE
        // ==========================================
        registeredAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);


// ==========================================
// PREVENT SAME STUDENT FROM REGISTERING
// TWICE FOR THE SAME EVENT
// ==========================================
registrationSchema.index(
    {
        student: 1,
        event: 1
    },
    {
        unique: true
    }
);


// ==========================================
// PREVENT SAME SEAT IN SAME EVENT
// ==========================================
registrationSchema.index(
    {
        event: 1,
        seatNumber: 1
    },
    {
        unique: true,

        partialFilterExpression: {
            seatNumber: {
                $type: "string"
            }
        }
    }
);


// ==========================================
// EXPORT MODEL
// ==========================================
module.exports = mongoose.model(
    "Registration",
    registrationSchema
);