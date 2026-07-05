import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import StudentCertificates from "./student/StudentCertificates.jsx";
import StudentEvents from "./student/StudentEvents.jsx";
import StudentProfile from "./student/StudentProfile.jsx";

import "./StudentDashboard.css";
import GtecSphereLogo from "../components/GtecSphereLogo.jsx";

const API_URL = "http://gtecsphere-backend.onrender.com/api";


function StudentDashboard() {
  const navigate = useNavigate();

  const [activePage, setActivePage] =
    useState("dashboard");

  const [registrations, setRegistrations] =
    useState([]);

  const [registrationsLoading, setRegistrationsLoading] =
    useState(true);

  const [registrationsError, setRegistrationsError] =
    useState("");

  const [selectedRegistration, setSelectedRegistration] =
    useState(null);


  // ==========================================
  // GET SAVED USER
  // ==========================================
  const savedUser = localStorage.getItem("user");

  let user = {};

  try {
    user = savedUser
      ? JSON.parse(savedUser)
      : {};
  } catch (error) {
    console.error(
      "INVALID SAVED USER:",
      error
    );

    user = {};
  }


  const firstName =
    user?.fullName?.split(" ")[0] ||
    "Student";


  // ==========================================
  // GET TOKEN
  // ==========================================
  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
    );
  };


  // ==========================================
  // LOGOUT
  // ==========================================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/");
  };


  // ==========================================
  // PAGE TITLES
  // ==========================================
  const pageTitles = {
    dashboard: "Dashboard",
    events: "Events",
    certificates: "Certificates",
    profile: "My Profile",
  };


  // ==========================================
  // FETCH MY REGISTRATIONS
  // ==========================================
  const fetchMyRegistrations = useCallback(
    async () => {
      try {
        const token = getToken();

        if (!token) {
          setRegistrations([]);
          setRegistrationsLoading(false);
          return;
        }

        setRegistrationsLoading(true);
        setRegistrationsError("");

        const response = await fetch(
          `${API_URL}/registrations/my`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load registrations"
          );
        }

        setRegistrations(
          data.registrations || []
        );
      } catch (error) {
        console.error(
          "DASHBOARD REGISTRATIONS ERROR:",
          error
        );

        setRegistrationsError(
          error.message
        );

        setRegistrations([]);
      } finally {
        setRegistrationsLoading(false);
      }
    },
    []
  );


  // ==========================================
  // LOAD DASHBOARD DATA
  // ==========================================
  useEffect(() => {
    fetchMyRegistrations();
  }, [fetchMyRegistrations]);


  // ==========================================
  // REFRESH WHEN RETURNING TO DASHBOARD
  // ==========================================
  useEffect(() => {
    if (activePage === "dashboard") {
      fetchMyRegistrations();
    }
  }, [
    activePage,
    fetchMyRegistrations,
  ]);


  // ==========================================
  // ACTIVE REGISTRATIONS
  // ==========================================
  const activeRegistrations =
    registrations.filter(
      (registration) =>
        registration.status !==
        "Cancelled"
    );


  // ==========================================
  // UPCOMING REGISTERED EVENTS
  // ==========================================
  const upcomingRegistrations =
    activeRegistrations
      .filter((registration) => {
        if (!registration.event?.date) {
          return false;
        }

        const eventDate =
          new Date(
            registration.event.date
          );

        return (
          !Number.isNaN(
            eventDate.getTime()
          ) &&
          eventDate >=
            new Date(
              new Date().setHours(
                0,
                0,
                0,
                0
              )
            )
        );
      })
      .sort(
        (first, second) =>
          new Date(
            first.event.date
          ) -
          new Date(
            second.event.date
          )
      );


  // ==========================================
  // FORMAT DATE
  // ==========================================
  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Date not available";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(date.getTime())
    ) {
      return "Date not available";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  // ==========================================
  // STATUS CLASS
  // ==========================================
  const getStatusClass = (status) => {
    return (
      status || "Registered"
    )
      .toLowerCase()
      .replace(/\s+/g, "-");
  };


  return (
    <div className="student-app">

      {/* =====================================
          DESKTOP SIDEBAR
      ===================================== */}

      <aside className="student-sidebar">
        <div className="dashboard-logo">
  <GtecSphereLogo
    size="small"
    variant="light"
    subtitle="STUDENT PORTAL"
  />
</div>

        <nav className="sidebar-nav">

          <button
            className={
              activePage === "dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("dashboard")
            }
          >
            <span>⌂</span>
            Dashboard
          </button>


          <button
            className={
              activePage === "events"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("events")
            }
          >
            <span>◫</span>
            Events
          </button>


          <button
            className={
              activePage === "certificates"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "certificates"
              )
            }
          >
            <span>◇</span>
            Certificates
          </button>


        

          <button
            className={
              activePage === "profile"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("profile")
            }
          >
            <span>○</span>
            My Profile
          </button>

        </nav>


        <div className="sidebar-bottom">
          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>


      {/* =====================================
          MAIN CONTENT
      ===================================== */}

      <main className="student-main">

        {/* TOP BAR */}

        <header className="student-topbar">

          <div className="mobile-dashboard-logo">
  <GtecSphereLogo
    size="small"
    variant="light"
  />
</div>


          <div className="topbar-title">
            <p>STUDENT PORTAL</p>

            <h2>
              {pageTitles[activePage]}
            </h2>
          </div>


          <div className="topbar-actions">

            <button className="notification-button">
              ♢
              <span className="notification-dot"></span>
            </button>


            <button
              className="student-profile-button"
              onClick={() =>
                setActivePage("profile")
              }
            >
              <span className="student-avatar">
                {firstName
                  .charAt(0)
                  .toUpperCase()}
              </span>

              <span className="student-profile-info">
                <strong>
                  {user?.fullName ||
                    "Student"}
                </strong>

                <small>
                  {user?.department ||
                    "Department"}
                </small>
              </span>
            </button>

          </div>
        </header>


        {/* =====================================
            DASHBOARD PAGE
        ===================================== */}

        {activePage === "dashboard" && (
          <div className="dashboard-content">

            {/* WELCOME */}

            <section className="welcome-card">
              <div>
                <p className="welcome-label">
                  WELCOME BACK
                </p>

                <h1>
                  Hey, {firstName}{" "}
                  <span>👋</span>
                </h1>

                <p>
                  Here’s what’s happening
                  in your campus sphere
                  today.
                </p>
              </div>

              <div className="welcome-decoration">
                <span>G</span>
              </div>
            </section>


            {/* =====================================
                STATS
            ===================================== */}

            <section className="stats-grid">

              <article
                className="stat-card"
                onClick={() =>
                  setActivePage("events")
                }
              >
                <div className="stat-icon">
                  ◫
                </div>

                <div>
                  <p>
                    Registered Events
                  </p>

                  <h3>
                    {registrationsLoading
                      ? "..."
                      : activeRegistrations.length}
                  </h3>
                </div>

                <span className="stat-link">
                  View →
                </span>
              </article>


              <article
                className="stat-card"
                onClick={() =>
                  setActivePage(
                    "certificates"
                  )
                }
              >
                <div className="stat-icon">
                  ◇
                </div>

                <div>
                  <p>Certificates</p>
                  <h3>0</h3>
                </div>

                <span className="stat-link">
                  View →
                </span>
              </article>


              <article
                className="stat-card"
                onClick={() =>
                  setActivePage(
                    "opportunities"
                  )
                }
              >
                <div className="stat-icon">
                  ↗
                </div>

                <div>
                  <p>Opportunities</p>
                  <h3>0</h3>
                </div>

                <span className="stat-link">
                  Explore →
                </span>
              </article>

            </section>


            {/* =====================================
                MY REGISTRATIONS
            ===================================== */}

            <section className="student-registrations-section">

              <div className="section-heading">
                <div>
                  <p>MY ACTIVITY</p>

                  <h2>
                    My Registrations
                  </h2>
                </div>

                <button
                  onClick={() =>
                    setActivePage("events")
                  }
                >
                  Explore events →
                </button>
              </div>


              {registrationsLoading && (
                <div className="registration-dashboard-empty">
                  <div>◷</div>

                  <h3>
                    Loading your registrations...
                  </h3>
                </div>
              )}


              {!registrationsLoading &&
                registrationsError && (
                  <div className="registration-dashboard-empty">
                    <div>!</div>

                    <h3>
                      Unable to load registrations
                    </h3>

                    <p>
                      {registrationsError}
                    </p>

                    <button
                      onClick={
                        fetchMyRegistrations
                      }
                    >
                      Try Again
                    </button>
                  </div>
                )}


              {!registrationsLoading &&
                !registrationsError &&
                activeRegistrations.length ===
                  0 && (
                  <div className="registration-dashboard-empty">
                    <div>◫</div>

                    <h3>
                      No registrations yet
                    </h3>

                    <p>
                      Register for a campus
                      event and your
                      acknowledgement will
                      appear here.
                    </p>

                    <button
                      onClick={() =>
                        setActivePage(
                          "events"
                        )
                      }
                    >
                      Explore Events
                    </button>
                  </div>
                )}


              {!registrationsLoading &&
                !registrationsError &&
                activeRegistrations.length >
                  0 && (
                  <div className="student-registration-grid">

                    {activeRegistrations.map(
                      (registration) => (
                        <article
                          className="student-registration-card"
                          key={
                            registration._id
                          }
                        >

                          <div className="registration-card-top">

                            <span className="registration-type-badge">
                              {registration.registrationType ===
                              "Team"
                                ? "👥 Team"
                                : "👤 Individual"}
                            </span>


                            <span
                              className={`registration-status-badge ${getStatusClass(
                                registration.status
                              )}`}
                            >
                              {registration.status ||
                                "Registered"}
                            </span>

                          </div>


                          <div className="registration-card-content">

                            <p className="registration-event-category">
                              {registration.event
                                ?.category ||
                                "EVENT"}
                            </p>


                            <h3>
                              {registration.event
                                ?.title ||
                                "Event"}
                            </h3>


                            {registration.registrationType ===
                              "Team" &&
                              registration.teamName && (
                                <div className="registration-team-info">
                                  <span>
                                    TEAM
                                  </span>

                                  <strong>
                                    {
                                      registration.teamName
                                    }
                                  </strong>
                                </div>
                              )}


                            <div className="registration-event-meta">

                              <div>
                                <span>◷</span>

                                <p>
                                  <small>
                                    DATE
                                  </small>

                                  <strong>
                                    {formatDate(
                                      registration
                                        .event
                                        ?.date
                                    )}
                                  </strong>
                                </p>
                              </div>


                              <div>
                                <span>⌖</span>

                                <p>
                                  <small>
                                    VENUE
                                  </small>

                                  <strong>
                                    {registration.event
                                      ?.venue ||
                                      "Not specified"}
                                  </strong>
                                </p>
                              </div>

                            </div>


                            <div className="dashboard-acknowledgement-box">
                              <small>
                                ACKNOWLEDGEMENT
                              </small>

                              <strong>
                                {registration.acknowledgementNumber ||
                                  "Generating..."}
                              </strong>
                            </div>

                          </div>


                          <button
                            type="button"
                            className="view-registration-button"
                            onClick={() =>
                              setSelectedRegistration(
                                registration
                              )
                            }
                          >
                            View Details →
                          </button>

                        </article>
                      )
                    )}

                  </div>
                )}

            </section>


            {/* =====================================
                DASHBOARD MAIN GRID
            ===================================== */}

            <section className="dashboard-grid">

              <div className="dashboard-section">

                <div className="section-heading">
                  <div>
                    <p>DISCOVER</p>

                    <h2>
                      Upcoming Events
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      setActivePage("events")
                    }
                  >
                    View all →
                  </button>
                </div>


                {upcomingRegistrations.length >
                0 ? (
                  <div className="dashboard-upcoming-list">

                    {upcomingRegistrations
                      .slice(0, 3)
                      .map(
                        (registration) => (
                          <article
                            className="dashboard-upcoming-item"
                            key={
                              registration._id
                            }
                          >
                            <div className="upcoming-date-box">
                              <strong>
                                {new Date(
                                  registration
                                    .event
                                    .date
                                )
                                  .getDate()
                                  .toString()
                                  .padStart(
                                    2,
                                    "0"
                                  )}
                              </strong>

                              <span>
                                {new Date(
                                  registration
                                    .event
                                    .date
                                )
                                  .toLocaleString(
                                    "en-US",
                                    {
                                      month:
                                        "short",
                                    }
                                  )
                                  .toUpperCase()}
                              </span>
                            </div>


                            <div className="upcoming-event-info">
                              <small>
                                {registration
                                  .event
                                  .category ||
                                  "EVENT"}
                              </small>

                              <h3>
                                {registration
                                  .event
                                  .title}
                              </h3>

                              <p>
                                {registration
                                  .event
                                  .time ||
                                  "Time not specified"}{" "}
                                •{" "}
                                {registration
                                  .event
                                  .venue ||
                                  "Venue not specified"}
                              </p>
                            </div>


                            <button
                              type="button"
                              onClick={() =>
                                setSelectedRegistration(
                                  registration
                                )
                              }
                            >
                              →
                            </button>
                          </article>
                        )
                      )}

                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      ◫
                    </div>

                    <h3>
                      No upcoming registered
                      events
                    </h3>

                    <p>
                      Events you register for
                      will appear here.
                    </p>

                    <button
                      onClick={() =>
                        setActivePage(
                          "events"
                        )
                      }
                    >
                      Explore Events
                    </button>
                  </div>
                )}

              </div>


              {/* =====================================
                  PROFILE CARD
              ===================================== */}

              <aside className="student-summary-card">

                <div className="summary-header">

                  <span className="summary-avatar">
                    {firstName
                      .charAt(0)
                      .toUpperCase()}
                  </span>


                  <div>
                    <h3>
                      {user?.fullName ||
                        "Student"}
                    </h3>

                    <p>
                      {user?.registerNumber ||
                        "Register Number"}
                    </p>
                  </div>

                </div>


                <div className="summary-details">

                  <div>
                    <span>
                      Department
                    </span>

                    <strong>
                      {user?.department ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>Year</span>

                    <strong>
                      {user?.year
                        ? `Year ${user.year}`
                        : "—"}
                    </strong>
                  </div>


                  <div>
                    <span>Section</span>

                    <strong>
                      {user?.section ||
                        "—"}
                    </strong>
                  </div>

                </div>


                <button
                  onClick={() =>
                    setActivePage("profile")
                  }
                >
                  View Profile →
                </button>

              </aside>

            </section>
          </div>
        )}


        {/* =====================================
            EVENTS PAGE
        ===================================== */}

        {activePage === "events" && (
          <div className="dashboard-content">
            <StudentEvents />
          </div>
        )}


        {/* =====================================
            CERTIFICATES
        ===================================== */}

        {activePage === "certificates" && (
          <div className="dashboard-content">
            <StudentCertificates />
          </div>
        )}


        

        {/* =====================================
            PROFILE
        ===================================== */}

        {activePage === "profile" && (
          <div className="dashboard-content">
            <StudentProfile />
          </div>
        )}

      </main>


      {/* =====================================
          ACKNOWLEDGEMENT DETAILS MODAL
      ===================================== */}

      {selectedRegistration && (
        <div className="dashboard-registration-modal-overlay">

          <div className="dashboard-registration-modal">

            <div className="dashboard-registration-modal-header">

              <div>
                <p>
                  REGISTRATION DETAILS
                </p>

                <h2>
                  {selectedRegistration
                    .event?.title ||
                    "Event Registration"}
                </h2>
              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedRegistration(
                    null
                  )
                }
              >
                ×
              </button>

            </div>


            <div className="dashboard-registration-modal-body">

              <div className="dashboard-modal-success">
                ✓
              </div>


              <p className="dashboard-modal-label">
                ACKNOWLEDGEMENT NUMBER
              </p>


              <div className="dashboard-modal-acknowledgement">
                {selectedRegistration
                  .acknowledgementNumber ||
                  "Not available"}
              </div>


              <div className="dashboard-modal-details">

                <div>
                  <span>
                    Registration Type
                  </span>

                  <strong>
                    {selectedRegistration
                      .registrationType ||
                      "Individual"}
                  </strong>
                </div>


                <div>
                  <span>Status</span>

                  <strong>
                    {selectedRegistration
                      .status ||
                      "Registered"}
                  </strong>
                </div>


                {selectedRegistration
                  .teamName && (
                  <div>
                    <span>Team Name</span>

                    <strong>
                      {selectedRegistration
                        .teamName}
                    </strong>
                  </div>
                )}


                <div>
                  <span>Event Date</span>

                  <strong>
                    {formatDate(
                      selectedRegistration
                        .event?.date
                    )}
                  </strong>
                </div>


                <div>
                  <span>Time</span>

                  <strong>
                    {selectedRegistration
                      .event?.time ||
                      "Not specified"}
                  </strong>
                </div>


                <div>
                  <span>Venue</span>

                  <strong>
                    {selectedRegistration
                      .event?.venue ||
                      "Not specified"}
                  </strong>
                </div>

              </div>


              {selectedRegistration
                .projectTitle && (
                <div className="dashboard-project-box">

                  <small>
                    PROJECT / TOPIC
                  </small>

                  <h3>
                    {selectedRegistration
                      .projectTitle}
                  </h3>

                  {selectedRegistration
                    .projectDescription && (
                    <p>
                      {selectedRegistration
                        .projectDescription}
                    </p>
                  )}

                </div>
              )}


              {selectedRegistration
                .registrationType ===
                "Team" &&
                selectedRegistration
                  .teamMembers?.length >
                  0 && (
                  <div className="dashboard-team-list">

                    <div className="dashboard-team-list-heading">
                      <p>TEAM MEMBERS</p>

                      <span>
                        {
                          selectedRegistration
                            .teamMembers
                            .length
                        }{" "}
                        members
                      </span>
                    </div>


                    {selectedRegistration
                      .teamMembers
                      .map(
                        (
                          member,
                          index
                        ) => (
                          <div
                            className="dashboard-team-member"
                            key={
                              member._id ||
                              index
                            }
                          >
                            <span>
                              {index + 1}
                            </span>

                            <div>
                              <strong>
                                {member.name}
                              </strong>

                              <small>
                                {member.registerNumber}
                                {member.department
                                  ? ` • ${member.department}`
                                  : ""}
                              </small>
                            </div>
                          </div>
                        )
                      )}

                  </div>
                )}


              <button
                type="button"
                className="dashboard-modal-done-button"
                onClick={() =>
                  setSelectedRegistration(
                    null
                  )
                }
              >
                Done
              </button>

            </div>

          </div>

        </div>
      )}


      {/* =====================================
          MOBILE BOTTOM NAVIGATION
      ===================================== */}

      <nav className="mobile-bottom-nav">

        <button
          className={
            activePage === "dashboard"
              ? "active"
              : ""
          }
          onClick={() =>
            setActivePage("dashboard")
          }
        >
          <span>⌂</span>
          <small>Home</small>
        </button>


        <button
          className={
            activePage === "events"
              ? "active"
              : ""
          }
          onClick={() =>
            setActivePage("events")
          }
        >
          <span>◫</span>
          <small>Events</small>
        </button>


        <button
          className={
            activePage === "certificates"
              ? "active"
              : ""
          }
          onClick={() =>
            setActivePage(
              "certificates"
            )
          }
        >
          <span>◇</span>
          <small>
            Certificates
          </small>
        </button>


        <button
          className={
            activePage === "profile"
              ? "active"
              : ""
          }
          onClick={() =>
            setActivePage("profile")
          }
        >
          <span>○</span>
          <small>Profile</small>
        </button>

      </nav>

    </div>
  );
}


export default StudentDashboard;