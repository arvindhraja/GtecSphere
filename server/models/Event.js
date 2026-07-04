const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
{
    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    venue: {
        type: String,
        required: true
    },

    date: {
        type: Date,
        required: true
    },

    time: {
        type: String,
        required: true
    },

    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    image: {
        type: String,
        default: ""
    },

    maxParticipants: {
        type: Number,
        default: 100
    },

    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    status: {
        type: String,
        enum: ["Upcoming", "Ongoing", "Completed"],
        default: "Upcoming"
    }

},
{
    timestamps: true
});

module.exports = mongoose.model("Event", eventSchema);