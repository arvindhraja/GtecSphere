const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        venue: {
            type: String,
            required: true,
            trim: true
        },

        date: {
            type: Date,
            required: true
        },

        time: {
            type: String,
            required: true
        },

        // USER WHO CREATED THE EVENT
        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // COORDINATORS ASSIGNED BY ADMIN
        assignedCoordinators: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        image: {
            type: String,
            default: ""
        },

        maxParticipants: {
            type: Number,
            default: 100,
            min: 1
        },

        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        // EVENT LIFECYCLE
        status: {
            type: String,
            enum: [
                "Upcoming",
                "Ongoing",
                "Completed",
                "Cancelled"
            ],
            default: "Upcoming"
        },

        // CONTROLS WHETHER STUDENTS CAN SEE THE EVENT
        publicationStatus: {
            type: String,
            enum: ["Draft", "Published"],
            default: "Draft"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Event", eventSchema);