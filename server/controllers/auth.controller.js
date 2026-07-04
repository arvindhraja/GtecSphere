const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

// =====================================
// REGISTER USER
// PUBLIC REGISTRATION = STUDENT ONLY
// =====================================
const register = async (req, res) => {
    try {
        const {
            fullName,
            registerNumber,
            email,
            password,
            department,
            year,
            section,
            phone
        } = req.body;

        // Validate required fields
        if (
            !fullName ||
            !registerNumber ||
            !email ||
            !password ||
            !department ||
            !year ||
            !section ||
            !phone
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check existing email
        const existingEmail = await User.findOne({
            email
        });

        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Check existing register number
        const existingRegister = await User.findOne({
            registerNumber
        });

        if (existingRegister) {
            return res.status(400).json({
                success: false,
                message: "Register Number already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // Create user
        // IMPORTANT: Public registration is ALWAYS student
        const user = await User.create({
            fullName,
            registerNumber,
            email,
            password: hashedPassword,
            role: "student",
            department,
            year,
            section,
            phone
        });

        // Generate student token
        const token = generateToken(
            user._id,
            user.role
        );

        // Remove password from response
        const safeUser = await User.findById(user._id)
            .select("-password");

        return res.status(201).json({
            success: true,
            message: "Registration Successful",
            token,
            user: safeUser
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// =====================================
// LOGIN USER
// =====================================
const login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required"
            });
        }

        // Find user
        const user = await User.findOne({
            email
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Block deactivated account
        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Contact admin."
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid Password"
            });
        }

        // Generate token using database role
        const token = generateToken(
            user._id,
            user.role
        );

        // Remove password from response
        const safeUser = await User.findById(user._id)
            .select("-password");

        return res.status(200).json({
            success: true,
            message: "Login Successful",
            token,
            user: safeUser
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// =====================================
// EXPORT CONTROLLERS
// =====================================
module.exports = {
    register,
    login
};