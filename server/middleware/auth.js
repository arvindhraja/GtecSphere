const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        let token;

        // Get token from Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        // No token
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access Denied. No Token Provided."
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Find logged-in user
        const user = await User.findById(decoded.id)
            .select("-password");

        // User deleted or not found
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found."
            });
        }

        // Block deactivated users
        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Contact admin."
            });
        }

        // Attach user to request
        req.user = user;

        next();

    } catch (err) {
        console.error("AUTH ERROR:", err.message);

        return res.status(401).json({
            success: false,
            message: "Invalid Token"
        });
    }
};

module.exports = protect;