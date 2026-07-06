const User = require("../models/User");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const generateToken = require("../utils/generateToken");

// =====================================
// EMAIL TRANSPORTER
// =====================================
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4,

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },

    tls: {
        rejectUnauthorized: false
    }
});

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

        const normalizedEmail = email.toLowerCase().trim();

        const existingEmail = await User.findOne({
            email: normalizedEmail
        });

        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        const existingRegister = await User.findOne({
            registerNumber
        });

        if (existingRegister) {
            return res.status(400).json({
                success: false,
                message: "Register Number already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullName,
            registerNumber,
            email: normalizedEmail,
            password: hashedPassword,
            role: "student",
            department,
            year,
            section,
            phone
        });

        const token = generateToken(user._id, user.role);

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
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Contact admin."
            });
        }

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

        const token = generateToken(
            user._id,
            user.role
        );

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
// FORGOT PASSWORD - SEND OTP
// =====================================
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email"
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Contact admin."
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // Hash OTP before saving
        const hashedOTP = await bcrypt.hash(otp, 10);

        // OTP valid for 10 minutes
        user.resetPasswordOTP = hashedOTP;
        user.resetPasswordOTPExpires =
            new Date(Date.now() + 10 * 60 * 1000);
        user.resetPasswordOTPVerified = false;

        await user.save();

        // Send OTP email
        await transporter.sendMail({
            from: `"GtecSphere" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "GtecSphere Password Reset OTP",
            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: auto;
                    padding: 30px;
                    background: #f5f7fb;
                ">
                    <div style="
                        background: white;
                        padding: 35px;
                        border-radius: 16px;
                        text-align: center;
                    ">
                        <h1 style="color: #4f46e5;">
                            GtecSphere
                        </h1>

                        <h2>Password Reset OTP</h2>

                        <p>Hello ${user.fullName},</p>

                        <p>
                            Use the following OTP to reset
                            your GtecSphere password:
                        </p>

                        <div style="
                            font-size: 36px;
                            font-weight: bold;
                            letter-spacing: 10px;
                            color: #4f46e5;
                            margin: 25px 0;
                        ">
                            ${otp}
                        </div>

                        <p>
                            This OTP is valid for
                            <strong>10 minutes</strong>.
                        </p>

                        <p style="
                            color: #777;
                            font-size: 13px;
                        ">
                            If you did not request a password
                            reset, ignore this email.
                        </p>
                    </div>
                </div>
            `
        });

        return res.status(200).json({
            success: true,
            message: "6-digit OTP sent to your registered email"
        });

    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to send OTP. Please try again."
        });
    }
};

// =====================================
// VERIFY RESET OTP
// =====================================
const verifyResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // select: false fields must be manually included
        const user = await User.findOne({
            email: normalizedEmail
        }).select(
            "+resetPasswordOTP " +
            "+resetPasswordOTPExpires " +
            "+resetPasswordOTPVerified"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.resetPasswordOTP) {
            return res.status(400).json({
                success: false,
                message: "Please request a new OTP"
            });
        }

        if (
            !user.resetPasswordOTPExpires ||
            user.resetPasswordOTPExpires < new Date()
        ) {
            user.resetPasswordOTP = null;
            user.resetPasswordOTPExpires = null;
            user.resetPasswordOTPVerified = false;

            await user.save();

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Request a new OTP."
            });
        }

        const isOTPValid = await bcrypt.compare(
            otp.toString(),
            user.resetPasswordOTP
        );

        if (!isOTPValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        user.resetPasswordOTPVerified = true;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully"
        });

    } catch (error) {
        console.error("VERIFY OTP ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify OTP"
        });
    }
};

// =====================================
// RESET PASSWORD
// =====================================
const resetPassword = async (req, res) => {
    try {
        const {
            email,
            newPassword,
            confirmPassword
        } = req.body;

        if (
            !email ||
            !newPassword ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({
            email: normalizedEmail
        }).select(
            "+resetPasswordOTP " +
            "+resetPasswordOTPExpires " +
            "+resetPasswordOTPVerified"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.resetPasswordOTPVerified !== true) {
            return res.status(403).json({
                success: false,
                message: "Please verify OTP first"
            });
        }

        if (
            !user.resetPasswordOTPExpires ||
            user.resetPasswordOTPExpires < new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "Reset session expired. Request a new OTP."
            });
        }

        // Hash new password
        user.password = await bcrypt.hash(
            newPassword,
            10
        );

        // Clear OTP data
        user.resetPasswordOTP = null;
        user.resetPasswordOTPExpires = null;
        user.resetPasswordOTPVerified = false;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful. Please login again."
        });

    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to reset password"
        });
    }
};

// =====================================
// EXPORT CONTROLLERS
// =====================================
module.exports = {
    register,
    login,
    forgotPassword,
    verifyResetOTP,
    resetPassword
};