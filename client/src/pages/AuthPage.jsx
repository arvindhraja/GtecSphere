import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import GtecSphereLogo from "../components/GtecSphereLogo.jsx";

const API_BASE_URL =
  "https://gtecsphere-backend.onrender.com";

const initialFormData = {
  fullName: "",
  registerNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
  department: "",
  year: "",
  section: "",
  phone: "",
};

function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const [formData, setFormData] = useState(initialFormData);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0,
  });

  // ==========================================
  // CUSTOM CURSOR
  // ==========================================
  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({
        x: event.clientX,
        y: event.clientY,
      });
    };

    const handleMouseOver = (event) => {
      const interactiveElement = event.target.closest(
        "button, a, input, select, [data-cursor-hover]"
      );

      setIsHovering(Boolean(interactiveElement));
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  // ==========================================
  // INPUT CHANGE
  // ==========================================
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (message.text) {
      setMessage({
        type: "",
        text: "",
      });
    }
  };

  // ==========================================
  // SWITCH AUTH MODE
  // ==========================================
  const switchMode = (loginMode) => {
    setIsLogin(loginMode);
    setShowPassword(false);
    setMessage({
      type: "",
      text: "",
    });

    setFormData(initialFormData);
  };

  // ==========================================
  // SAVE AUTH DATA
  // ==========================================
  const saveAuthData = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  };

  // ==========================================
  // ROLE REDIRECT
  // TEMPORARY UNTIL DASHBOARDS ARE CREATED
  // ==========================================
  const redirectByRole = (user) => {
  const role = user?.role;

  if (role === "admin") {
    navigate("/admin");
    return;
  }

  if (role === "coordinator") {
    navigate("/coordinator");
    return;
  }

  navigate("/student");
};
  // ==========================================
  // SUBMIT LOGIN / REGISTER
  // ==========================================
  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage({
      type: "",
      text: "",
    });

    if (isLogin) {
      if (!formData.email.trim() || !formData.password) {
        setMessage({
          type: "error",
          text: "Please enter your email and password.",
        });
        return;
      }
    }

    if (!isLogin) {
      const requiredFields = [
        formData.fullName,
        formData.registerNumber,
        formData.email,
        formData.password,
        formData.department,
        formData.year,
        formData.section,
        formData.phone,
      ];

      if (requiredFields.some((field) => !String(field).trim())) {
        setMessage({
          type: "error",
          text: "Please complete all registration fields.",
        });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setMessage({
          type: "error",
          text: "Passwords do not match.",
        });
        return;
      }

      if (formData.password.length < 6) {
        setMessage({
          type: "error",
          text: "Password must contain at least 6 characters.",
        });
        return;
      }
    }

    try {
      setLoading(true);

      const endpoint = isLogin
        ? `${API_BASE_URL}/api/auth/login`
        : `${API_BASE_URL}/api/auth/register`;

      const requestBody = isLogin
        ? {
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
          }
        : {
            fullName: formData.fullName.trim(),
            registerNumber: formData.registerNumber.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            department: formData.department,
            year: formData.year,
            section: formData.section.trim().toUpperCase(),
            phone: formData.phone.trim(),
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      console.log("BACKEND RESPONSE:", data);

      if (!response.ok || !data.success) {
        setMessage({
          type: "error",
          text: data.message || "Something went wrong. Please try again.",
        });
        return;
      }

      // Save token and user for BOTH registration and login
      saveAuthData(data);

      if (!isLogin) {
        setMessage({
          type: "success",
          text: "Registration Successful! Opening Student Dashboard...",
        });

        setTimeout(() => {
          navigate("/student", { replace: true });
        }, 1500);

        return;
      }

      setMessage({
        type: "success",
        text: "Login Successful! Opening your dashboard...",
      });

      setTimeout(() => {
        redirectByRole(data.user);
      }, 800);
    } catch (error) {
      console.error("AUTH ERROR:", error);

      setMessage({
        type: "error",
        text:
          error.message ||
          "Unable to connect to the server. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* MOUSE GLOW */}
      <div
        className="mouse-glow"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
        }}
      />

      {/* CUSTOM CURSOR */}
      <div
        className={`custom-cursor ${
          isHovering ? "cursor-hover" : ""
        }`}
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
        }}
      />

      <main className="auth-page">
        {/* ======================================
            LEFT BRAND PANEL
        ====================================== */}

        <section className="brand-panel">
          <div className="brand-content">
            <div className="logo" data-cursor-hover>
  <GtecSphereLogo
    size="large"
    variant="dark"
  />
</div>

            <div className="hero-content">
              <p className="eyebrow">
                YOUR CAMPUS. ONE SPHERE.
              </p>

              <h1>
                Connect. Learn.
                <br />
                <span>Grow Together.</span>
              </h1>

              <p className="hero-description">
                A smarter digital platform for students,
                events, certificates, opportunities and your
                complete campus journey.
              </p>

              <div className="feature-row">
                <div className="feature" data-cursor-hover>
                  <strong>01</strong>
                  <span>Discover Events</span>
                </div>

                <div className="feature" data-cursor-hover>
                  <strong>02</strong>
                  <span>Build Your Profile</span>
                </div>

                <div className="feature" data-cursor-hover>
                  <strong>03</strong>
                  <span>Grow Your Network</span>
                </div>
              </div>
            </div>

            <p className="brand-footer">
              Built for students. Powered by zoro.
            </p>
          </div>
        </section>

        {/* ======================================
            RIGHT AUTH PANEL
        ====================================== */}

        <section className="form-panel">
          <div className="mobile-logo">
            <span className="logo-icon">G</span>
            <span>GtecSphere</span>
          </div>

          <div
            key={isLogin ? "login" : "register"}
            className={`auth-container auth-enter ${
              !isLogin ? "register-container" : ""
            }`}
          >
            {/* AUTH HEADER */}

            <div className="auth-header">
              <p className="welcome-text">
                {isLogin
                  ? "WELCOME BACK"
                  : "JOIN THE SPHERE"}
              </p>

              <h2>
                {isLogin
                  ? "Sign in to your account"
                  : "Create your account"}
              </h2>

              <p>
                {isLogin
                  ? "Continue your GtecSphere journey."
                  : "Start your GtecSphere journey today."}
              </p>
            </div>

            {/* LOGIN / REGISTER TABS */}

            <div className="auth-tabs">
              <button
                type="button"
                className={isLogin ? "active" : ""}
                onClick={() => switchMode(true)}
                disabled={loading}
              >
                Login
              </button>

              <button
                type="button"
                className={!isLogin ? "active" : ""}
                onClick={() => switchMode(false)}
                disabled={loading}
              >
                Register
              </button>
            </div>

            {/* STATUS MESSAGE */}

            {message.text && (
              <div
                className={`auth-message ${message.type}`}
                role="alert"
              >
                <span>
                  {message.type === "success" ? "✓" : "!"}
                </span>

                <p>{message.text}</p>
              </div>
            )}

            {/* AUTH FORM */}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              {/* REGISTER FIELDS */}

              {!isLogin && (
                <>
                  <div className="register-grid">
                    <div className="input-group">
                      <label htmlFor="fullName">
                        Full Name
                      </label>

                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        autoComplete="name"
                        disabled={loading}
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="registerNumber">
                        Register Number
                      </label>

                      <input
                        id="registerNumber"
                        name="registerNumber"
                        type="text"
                        value={formData.registerNumber}
                        onChange={handleChange}
                        placeholder="College register number"
                        autoComplete="off"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* EMAIL */}

              <div className="input-group">
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              {/* REGISTER ACADEMIC DETAILS */}

              {!isLogin && (
                <>
                  <div className="register-grid">
                    <div className="input-group">
                      <label htmlFor="department">
                        Department
                      </label>

                      <select
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        <option value="">
                          Select department
                        </option>

                        <option value="IT">
                          Information Technology
                        </option>

                        <option value="CSE">
                          Computer Science
                        </option>

                        <option value="ECE">
                          Electronics & Communication
                        </option>

                        <option value="EEE">
                          Electrical & Electronics
                        </option>

                        <option value="MECH">
                          Mechanical Engineering
                        </option>

                        <option value="CIVIL">
                          Civil Engineering
                        </option>

                        <option value="AIDS">
                          AI & Data Science
                        </option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label htmlFor="year">
                        Year
                      </label>

                      <select
                        id="year"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        <option value="">
                          Select year
                        </option>

                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                  </div>

                  <div className="register-grid">
                    <div className="input-group">
                      <label htmlFor="section">
                        Section
                      </label>

                      <input
                        id="section"
                        name="section"
                        type="text"
                        value={formData.section}
                        onChange={handleChange}
                        placeholder="Example: A"
                        maxLength="10"
                        disabled={loading}
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="phone">
                        Phone Number
                      </label>

                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="10-digit mobile number"
                        autoComplete="tel"
                        inputMode="numeric"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* PASSWORD */}

              <div className="input-group">
                <div className="label-row">
                  <label htmlFor="password">
                    Password
                  </label>

                  {isLogin && (
                    <button
                      type="button"
                      className="forgot-button"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="password-field">
                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword ? "text" : "password"
                    }
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete={
                      isLogin
                        ? "current-password"
                        : "new-password"
                    }
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="show-password"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}

              {!isLogin && (
                <div className="input-group">
                  <label htmlFor="confirmPassword">
                    Confirm Password
                  </label>

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Enter password again"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                className={`submit-button ${
                  loading ? "loading" : ""
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner" />

                    {isLogin
                      ? "Signing In..."
                      : "Creating Account..."}
                  </>
                ) : (
                  <>
                    {isLogin
                      ? "Sign In"
                      : "Create Account"}

                    <span className="submit-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            {/* SWITCH AUTH MODE */}

            <p className="switch-text">
              {isLogin
                ? "New to GtecSphere?"
                : "Already have an account?"}

              <button
                type="button"
                onClick={() => switchMode(!isLogin)}
                disabled={loading}
              >
                {isLogin
                  ? "Create account"
                  : "Sign in"}
              </button>
            </p>
          </div>

          <p className="form-footer">
            © 2026 GtecSphere · Privacy · Terms
          </p>
        </section>
      </main>
    </>
  );
}

export default AuthPage;   