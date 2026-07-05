import { useState } from "react";
import "./StudentProfile.css";

function StudentProfile() {
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : {};

  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    registerNumber: user?.registerNumber || "",
    email: user?.email || "",
    phone: user?.phone || "",
    department: user?.department || "",
    year: user?.year || "",
    section: user?.section || "",
  });

  const firstName =
    formData.fullName?.split(" ")[0] || "Student";

  const initials = formData.fullName
    ? formData.fullName
        .split(" ")
        .map((name) => name.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "S";

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || "",
      registerNumber: user?.registerNumber || "",
      email: user?.email || "",
      phone: user?.phone || "",
      department: user?.department || "",
      year: user?.year || "",
      section: user?.section || "",
    });

    setIsEditing(false);
  };

  const handleSave = () => {
    const updatedUser = {
      ...user,
      ...formData,
    };

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    setIsEditing(false);
  };

  return (
    <div className="student-profile-page">
      {/* HERO */}
      <section className="profile-hero">
        <div className="profile-hero-content">
          <p className="profile-eyebrow">
            YOUR CAMPUS IDENTITY
          </p>

          <h1>
            This is your
            <span> sphere.</span>
          </h1>

          <p>
            Manage your personal details, academic information
            and your GtecSphere student identity.
          </p>
        </div>

        <div className="profile-hero-decoration">
          <span>○</span>
        </div>
      </section>

      {/* PROFILE OVERVIEW */}
      <section className="profile-overview-card">
        <div className="profile-main-info">
          <div className="profile-large-avatar">
            {initials}
          </div>

          <div>
            <p className="profile-role">
              STUDENT ACCOUNT
            </p>

            <h2>
              {formData.fullName || "Student"}
            </h2>

            <p className="profile-register-number">
              {formData.registerNumber ||
                "Register Number"}
            </p>
          </div>
        </div>

        <div className="profile-overview-actions">
          <span className="profile-status">
            <i />
            Active Student
          </span>

          {!isEditing && (
            <button
              type="button"
              className="profile-edit-button"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
              <span>✎</span>
            </button>
          )}
        </div>
      </section>

      {/* PROFILE CONTENT */}
      <section className="profile-content-grid">
        {/* PERSONAL DETAILS */}
        <div className="profile-details-card">
          <div className="profile-section-heading">
            <div>
              <p>PERSONAL</p>
              <h2>Personal Information</h2>
            </div>

            <span>01</span>
          </div>

          <div className="profile-fields-grid">
            <div className="profile-field">
              <label htmlFor="fullName">
                Full Name
              </label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="registerNumber">
                Register Number
              </label>

              <input
                id="registerNumber"
                name="registerNumber"
                type="text"
                value={formData.registerNumber}
                disabled
              />
            </div>

            <div className="profile-field">
              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="phone">
                Phone Number
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* STUDENT ID CARD */}
        <aside className="digital-id-card">
          <div className="digital-id-top">
            <div className="digital-id-logo">
              <span>G</span>
              <strong>GtecSphere</strong>
            </div>

            <span className="digital-id-year">
              2026
            </span>
          </div>

          <div className="digital-id-profile">
            <div className="digital-id-avatar">
              {initials}
            </div>

            <h3>
              {formData.fullName || "Student"}
            </h3>

            <p>
              {formData.registerNumber ||
                "Register Number"}
            </p>
          </div>

          <div className="digital-id-details">
            <div>
              <span>DEPARTMENT</span>
              <strong>
                {formData.department || "—"}
              </strong>
            </div>

            <div>
              <span>YEAR</span>
              <strong>
                {formData.year
                  ? `Year ${formData.year}`
                  : "—"}
              </strong>
            </div>

            <div>
              <span>SECTION</span>
              <strong>
                {formData.section || "—"}
              </strong>
            </div>
          </div>

          <div className="digital-id-footer">
            <span>
              Verified Student
            </span>

            <strong>●</strong>
          </div>
        </aside>

        {/* ACADEMIC DETAILS */}
        <div className="profile-details-card academic-card">
          <div className="profile-section-heading">
            <div>
              <p>ACADEMIC</p>
              <h2>Academic Information</h2>
            </div>

            <span>02</span>
          </div>

          <div className="profile-fields-grid">
            <div className="profile-field">
              <label htmlFor="department">
                Department
              </label>

              <input
                id="department"
                name="department"
                type="text"
                value={formData.department}
                disabled
              />
            </div>

            <div className="profile-field">
              <label htmlFor="year">
                Current Year
              </label>

              <input
                id="year"
                name="year"
                type="text"
                value={
                  formData.year
                    ? `Year ${formData.year}`
                    : ""
                }
                disabled
              />
            </div>

            <div className="profile-field">
              <label htmlFor="section">
                Section
              </label>

              <input
                id="section"
                name="section"
                type="text"
                value={formData.section}
                disabled
              />
            </div>

            <div className="profile-field">
              <label>
                Account Role
              </label>

              <input
                type="text"
                value="Student"
                disabled
              />
            </div>
          </div>
        </div>
      </section>

      {/* EDIT ACTION BAR */}
      {isEditing && (
        <div className="profile-edit-actions">
          <div>
            <strong>
              Editing your profile
            </strong>

            <p>
              Save your changes when you are done.
            </p>
          </div>

          <div>
            <button
              type="button"
              className="profile-cancel-button"
              onClick={handleCancel}
            >
              Cancel
            </button>

            <button
              type="button"
              className="profile-save-button"
              onClick={handleSave}
            >
              Save Changes
              <span>✓</span>
            </button>
          </div>
        </div>
      )}

      {/* GREETING */}
      <p className="profile-bottom-message">
        Keep growing, {firstName}. Your journey is just
        getting started. 🚀
      </p>
    </div>
  );
}

export default StudentProfile;