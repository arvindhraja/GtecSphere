import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import GtecSphereLogo from "../components/GtecSphereLogo.jsx";

const API_BASE_URL = "http://localhost:5000";

const initialFormData = {
  fullName: "",
  registerNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
  department: "IT",
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
      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      document.removeEventListener(
        "mouseover",
        handleMouseOver
      );
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
  // SWITCH LOGIN / REGISTER
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
  // SAVE LOGIN DATA
  // ==========================================

  const saveAuthData = (data) => {
    localStorage.setItem("token", data.token);

    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );
  };

  // ==========================================
  // REDIRECT BY ROLE
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
  // LOGIN / REGISTER SUBMIT
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage({
      type: "",
      text: "",
    });

    // ========================================
    // LOGIN VALIDATION
    // ========================================

    if (isLogin) {
      if (
        !formData.email.trim() ||
        !formData.password
      ) {
        setMessage({
          type: "error",
          text: "Please enter your email and password.",
        });

        return;
      }
    }

    // ========================================
    // REGISTRATION VALIDATION
    // ========================================

    if (!isLogin) {
      const requiredFields = [
        formData.fullName,
        formData.registerNumber,
        formData.email,
        formData.password,
        formData.year,
        formData.section,
        formData.phone,
      ];

      if (
        requiredFields.some(
          (field) => !String(field).trim()
        )
      ) {
        setMessage({
          type: "error",
          text: "Please complete all registration fields.",
        });

        return;
      }

      if (
        formData.password !==
        formData.confirmPassword
      ) {
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
            email: formData.email
              .trim()
              .toLowerCase(),

            password: formData.password,
          }
        : {
            fullName: formData.fullName.trim(),

            registerNumber:
              formData.registerNumber.trim(),

            email: formData.email
              .trim()
              .toLowerCase(),

            password: formData.password,

            // IT DEPARTMENT ONLY
            department: "IT",

            year: formData.year,

            section: formData.section
              .trim()
              .toUpperCase(),

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

          text:
            data.message ||
            "Something went wrong. Please try again.",
        });

        return;
      }

      saveAuthData(data);

      // ========================================
      // REGISTRATION SUCCESS
      // ========================================

      if (!isLogin) {
        setMessage({
          type: "success",

          text:
            "Registration Successful! Opening Student Portal...",
        });

        setTimeout(() => {
          navigate("/student", {
            replace: true,
          });
        }, 1500);

        return;
      }

      // ========================================
      // LOGIN SUCCESS
      // ========================================

      setMessage({
        type: "success",

        text:
          "Login Successful! Opening your portal...",
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
      {/* ======================================
          MOUSE GLOW
      ====================================== */}

      <div
        className="mouse-glow"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
        }}
      />

      {/* ======================================
          CUSTOM CURSOR
      ====================================== */}

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
        {/* ====================================
            LEFT BRAND PANEL
        ==================================== */}

        <section className="brand-panel">
          <div className="brand-content">
            <div
              className="logo"
              data-cursor-hover
            >
              <GtecSphereLogo
                size="large"
                variant="dark"
              />
            </div>

            {/* DEPARTMENT IDENTITY */}

            <div className="department-identity">
              <span>DEPARTMENT OF</span>

              <strong>
                INFORMATION TECHNOLOGY
              </strong>
            </div>

            <div className="hero-content">
              <p className="eyebrow">
                WE CODE EVENTS
              </p>

              <h1>
                Connect. Learn.
                <br />

                <span>Grow Together.</span>
              </h1>

              <p className="hero-description">
                The official digital event platform for the
                Department of Information Technology.
                Discover events, participate, earn
                certificates and celebrate every
                achievement in one sphere.
              </p>

              <div className="feature-row">
                <div
                  className="feature"
                  data-cursor-hover
                >
                  <strong>01</strong>
                  <span>Discover Events</span>
                </div>

                <div
                  className="feature"
                  data-cursor-hover
                >
                  <strong>02</strong>
                  <span>Participate</span>
                </div>

                <div
                  className="feature"
                  data-cursor-hover
                >
                  <strong>03</strong>
                  <span>Earn Certificates</span>
                </div>
              </div>
            </div>

            <p className="brand-footer">
              Department of Information Technology
              <span> · </span>
              GtecSphere
            </p>
          </div>
        </section>

        {/* ====================================
            RIGHT AUTH PANEL
        ==================================== */}

        <section className="form-panel">
          {/* MOBILE BRAND */}

          <div className="mobile-logo">
            <GtecSphereLogo
              size="small"
              variant="light"
            />

            <div className="mobile-department-name">
              <strong>GtecSphere</strong>

              <span>
                Department of Information Technology
              </span>
            </div>
          </div>

          <div
            key={isLogin ? "login" : "register"}
            className={`auth-container auth-enter ${
              !isLogin
                ? "register-container"
                : ""
            }`}
          >
            {/* AUTH HEADER */}

            <div className="auth-header">
              <p className="welcome-text">
                {isLogin
                  ? "WELCOME BACK"
                  : "JOIN THE IT SPHERE"}
              </p>

              <h2>
                {isLogin
                  ? "Sign in to your account"
                  : "Create your account"}
              </h2>

              <p>
                {isLogin
                  ? "Continue your GtecSphere journey."
                  : "Join the Department of Information Technology event community."}
              </p>
            </div>

            {/* LOGIN / REGISTER TABS */}

            <div className="auth-tabs">
              <button
                type="button"
                className={
                  isLogin ? "active" : ""
                }
                onClick={() =>
                  switchMode(true)
                }
                disabled={loading}
              >
                Login
              </button>

              <button
                type="button"
                className={
                  !isLogin ? "active" : ""
                }
                onClick={() =>
                  switchMode(false)
                }
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
                  {message.type === "success"
                    ? "✓"
                    : "!"}
                </span>

                <p>{message.text}</p>
              </div>
            )}

            {/* AUTH FORM */}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              {/* REGISTER NAME DETAILS */}

              {!isLogin && (
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
                      value={
                        formData.registerNumber
                      }
                      onChange={handleChange}
                      placeholder="College register number"
                      autoComplete="off"
                      disabled={loading}
                    />
                  </div>
                </div>
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
                  placeholder="Enter your registered email"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              {/* ACADEMIC DETAILS */}

              {!isLogin && (
                <>
                  <div className="register-grid">
                    {/* FIXED IT DEPARTMENT */}

                    <div className="input-group">
                      <label htmlFor="department">
                        Department
                      </label>

                      <div className="fixed-department-field">
                        <span className="department-code">
                          IT
                        </span>

                        <div>
                          <strong>
                            Information Technology
                          </strong>

                          <small>
                            Official Department
                          </small>
                        </div>

                        <span className="department-lock">
                          ✓
                        </span>
                      </div>
                    </div>

                    {/* YEAR */}

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

                        <option value="1">
                          1st Year
                        </option>

                        <option value="2">
                          2nd Year
                        </option>

                        <option value="3">
                          3rd Year
                        </option>

                        <option value="4">
                          4th Year
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="register-grid">
                    {/* SECTION */}

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

                    {/* PHONE */}

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
                      showPassword
                        ? "text"
                        : "password"
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
                    {showPassword
                      ? "Hide"
                      : "Show"}
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
                    value={
                      formData.confirmPassword
                    }
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

                    <span className="submit-arrow">
                      →
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* SWITCH MODE */}

            <p className="switch-text">
              {isLogin
                ? "New to GtecSphere?"
                : "Already have an account?"}

              <button
                type="button"
                onClick={() =>
                  switchMode(!isLogin)
                }
                disabled={loading}
              >
                {isLogin
                  ? "Create account"
                  : "Sign in"}
              </button>
            </p>
          </div>

          <p className="form-footer">
            © 2026 GtecSphere · Department of
            Information Technology
          </p>
        </section>
      </main>
    </>
  );
}

export default AuthPage;