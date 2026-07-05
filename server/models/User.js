const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        registerNumber: {
            type: String,
            required: function () {
                return this.role === "student";
            },
            unique: true,
            sparse: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        googleId: {
            type: String,
            default: null
        },

        role: {
            type: String,
            enum: [
                "student",
                "coordinator",
                "admin"
            ],
            default: "student"
        },

        department: {
            type: String,
            required: true,
            trim: true
        },

        year: {
            type: Number,
            required: function () {
                return this.role === "student";
            }
        },

        section: {
            type: String,
            required: function () {
                return this.role === "student";
            },
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        profileImage: {
            type: String,
            default: ""
        },

        // ==========================================
        // STUDENT FAVORITE EVENTS
        // ==========================================

        favoriteEvents: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Event"
            }
        ],

        // ==========================================
        // COORDINATOR ASSIGNED EVENTS
        // ADMIN CONTROLS THIS FIELD
        // ==========================================

        assignedEvents: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Event"
            }
        ],

        badges: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Badge"
            }
        ],

        points: {
            type: Number,
            default: 0
        },

        level: {
            type: Number,
            default: 1
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "User",
    userSchema
);