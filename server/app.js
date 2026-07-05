const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const eventRoutes = require("./routes/event.routes");
const registrationRoutes = require("./routes/registration.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const adminRoutes = require("./routes/admin.routes");
const studentRoutes = require("./routes/student.routes");
const coordinatorRoutes = require("./routes/coordinator.routes");
const certificateRoutes = require("./routes/certificate.routes");
const notificationRoutes = require("./routes/notification.routes");
const feedbackRoutes = require("./routes/feedback.routes");

const app = express();


// ==========================================
// ALLOWED FRONTEND ORIGINS
// ==========================================
const allowedOrigins = [
    "http://localhost:5173",
    "https://gtecsphere.netlify.app",
    process.env.CLIENT_URL
].filter(Boolean);


// ==========================================
// CORS MIDDLEWARE
// ==========================================
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.log("Blocked by CORS:", origin);

            return callback(
                new Error("Not allowed by CORS")
            );
        },
        credentials: true,
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);


// ==========================================
// OTHER MIDDLEWARES
// ==========================================
app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(cookieParser());


// ==========================================
// HOME ROUTE
// ==========================================
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "🚀 Welcome to GtecSphere Backend API"
    });
});


// ==========================================
// API ROUTES
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/coordinator", coordinatorRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/feedback", feedbackRoutes);


// ==========================================
// EXPORT APP
// ==========================================
module.exports = app;