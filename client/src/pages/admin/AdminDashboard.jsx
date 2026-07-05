import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import "./AdminDashboard.css";
import GtecSphereLogo from "../../components/GtecSphereLogo.jsx";
import CoordinatorEvents from "../coordinator/CoordinatorEvents.jsx";
import CoordinatorRegistrations from "../coordinator/CoordinatorRegistrations.jsx";
import CoordinatorSeats from "../coordinator/CoordinatorSeats.jsx";
import CoordinatorAttendance from "../coordinator/CoordinatorAttendance.jsx";
import CoordinatorCertificates from "../coordinator/CoordinatorCertificates.jsx";

import AdminStudents from "./AdminStudents.jsx";
import AdminCoordinators from "./AdminCoordinators.jsx";


const API_URL = "https://gtecsphere-backend.onrender.com/api";


const menuItems = [
  {
    id: "dashboard",
    icon: "⌂",
    label: "Dashboard",
  },
  {
    id: "events",
    icon: "◫",
    label: "Events",
  },
  {
    id: "registrations",
    icon: "👥",
    label: "Registrations",
  },
  {
    id: "seats",
    icon: "▦",
    label: "Seat Management",
  },
  {
    id: "attendance",
    icon: "✓",
    label: "Attendance",
  },
  {
    id: "certificates",
    icon: "◇",
    label: "Certificates",
  },
  {
    id: "students",
    icon: "◎",
    label: "Students",
  },
  {
    id: "coordinators",
    icon: "♟",
    label: "Coordinators",
  },
];


const pageTitles = {
  dashboard: "Dashboard",
  events: "Event Management",
  registrations: "Registrations",
  seats: "Seat Management",
  attendance: "Attendance",
  certificates: "Certificates",
  students: "Student Management",
  coordinators: "Coordinator Management",
};


function AdminDashboard() {
  const navigate = useNavigate();

  const [activePage, setActivePage] =
    useState("dashboard");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [dashboardData, setDashboardData] =
    useState(null);

  const [dashboardLoading, setDashboardLoading] =
    useState(true);

  const [dashboardError, setDashboardError] =
    useState("");


  // ==========================================
  // CURRENT ADMIN USER
  // ==========================================

  const savedUser = localStorage.getItem("user");

  let user = {};

  try {
    user = savedUser
      ? JSON.parse(savedUser)
      : {};
  } catch {
    user = {};
  }


  const adminName =
    user?.fullName ||
    user?.name ||
    "System Admin";


  const firstName =
    adminName?.split(" ")[0] ||
    "Admin";


  // ==========================================
  // FETCH LIVE ADMIN DASHBOARD
  // ==========================================

  const fetchDashboardStats =
    useCallback(async () => {
      try {
        setDashboardLoading(true);
        setDashboardError("");

        const response = await fetch(
          `${API_URL}/admin/stats`,
          {
            method: "GET",

            credentials: "include",

            headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
},
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load dashboard"
          );
        }

        setDashboardData(
          data.dashboard || null
        );

      } catch (error) {
        console.error(
          "ADMIN DASHBOARD FETCH ERROR:",
          error
        );

        setDashboardError(
          error.message ||
            "Unable to load dashboard"
        );

      } finally {
        setDashboardLoading(false);
      }
    }, []);


  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);


  // ==========================================
  // REFRESH DASHBOARD WHEN RETURNING HOME
  // ==========================================

  useEffect(() => {
    if (activePage === "dashboard") {
      fetchDashboardStats();
    }
  }, [
    activePage,
    fetchDashboardStats,
  ]);


  // ==========================================
  // LIVE VALUES
  // ==========================================

  const totalEvents =
    dashboardData?.events?.total || 0;

  const totalRegistrations =
    dashboardData?.registrations?.total || 0;

  const totalStudents =
    dashboardData?.users?.students || 0;

  const totalCoordinators =
    dashboardData?.users?.coordinators || 0;

  const totalCertificates =
    dashboardData?.certificates?.total || 0;

  const recentEvents =
    dashboardData?.recentEvents || [];


  // ==========================================
  // MENU CLICK
  // ==========================================

  const handleMenuClick = (pageId) => {
    setActivePage(pageId);
    setSidebarOpen(false);
  };


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };


  // ==========================================
  // DATE FORMAT
  // ==========================================

  const formatEventDate = (dateValue) => {
    if (!dateValue) {
      return "Date not set";
    }

    return new Date(
      dateValue
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="admin-app">

      {/* ======================================
          MOBILE OVERLAY
      ====================================== */}

      {sidebarOpen && (
        <button
          className="admin-sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
          aria-label="Close sidebar"
        />
      )}


      {/* ======================================
          SIDEBAR
      ====================================== */}

      <aside
        className={
          sidebarOpen
            ? "admin-sidebar open"
            : "admin-sidebar"
        }
      >
        <div className="admin-sidebar-header">
          <div className="admin-logo">
  <GtecSphereLogo
    size="small"
    variant="light"
    subtitle="ADMIN CONTROL"
  />
</div>

          <button
            className="admin-sidebar-close"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            ×
          </button>
        </div>


        <div className="admin-role-card">
          <span>♛</span>

          <div>
            <small>SIGNED IN AS</small>
            <strong>Administrator</strong>
          </div>
        </div>


        <nav className="admin-sidebar-nav">
          <p className="admin-menu-label">
            MANAGEMENT
          </p>

          {menuItems.map((item) => (
            <button
              key={item.id}

              className={
                activePage === item.id
                  ? "active"
                  : ""
              }

              onClick={() =>
                handleMenuClick(item.id)
              }
            >
              <span>{item.icon}</span>

              {item.label}
            </button>
          ))}
        </nav>


        <div className="admin-sidebar-bottom">
          <div className="admin-system-status">
            <span className="admin-status-dot" />

            <div>
              <strong>System Online</strong>

              <small>
                All services operational
              </small>
            </div>
          </div>

          <button
            className="admin-logout-button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>


      {/* ======================================
          MAIN
      ====================================== */}

      <main className="admin-main">

        {/* ====================================
            TOPBAR
        ==================================== */}

        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-menu-button"

              onClick={() =>
                setSidebarOpen(true)
              }
            >
              ☰
            </button>

            <div>
              <p>ADMIN PORTAL</p>

              <h2>
                {pageTitles[activePage]}
              </h2>
            </div>
          </div>


          <div className="admin-topbar-actions">
            <button className="admin-notification-button">
              ♢
              <span />
            </button>

            <div className="admin-profile-button">
              <span className="admin-avatar">
                {firstName
                  .charAt(0)
                  .toUpperCase()}
              </span>

              <div>
                <strong>
                  {adminName}
                </strong>

                <small>
                  Administrator
                </small>
              </div>
            </div>
          </div>
        </header>


        {/* ====================================
            DASHBOARD PAGE
        ==================================== */}

        {activePage === "dashboard" && (
          <div className="admin-content">

            {/* ==================================
                WELCOME
            ================================== */}

            <section className="admin-welcome-card">
              <div>
                <p className="admin-welcome-label">
                  SYSTEM OVERVIEW
                </p>

                <h1>
                  Welcome back, {firstName} 👑
                </h1>

                <p>
                  Manage the entire campus event
                  ecosystem from one command center.
                </p>
              </div>

              <div className="admin-welcome-decoration">
                <span>G</span>
              </div>
            </section>


            {/* ==================================
                ERROR
            ================================== */}

            {dashboardError && (
              <div className="students-error-banner">
                <div>
                  <strong>
                    Dashboard connection error
                  </strong>

                  <span>
                    {dashboardError}
                  </span>
                </div>

                <button
                  onClick={
                    fetchDashboardStats
                  }
                >
                  Retry
                </button>
              </div>
            )}


            {/* ==================================
                MAIN LIVE STATS
            ================================== */}

            <section className="admin-stats-grid">

              {/* TOTAL EVENTS */}

              <article>
                <div className="admin-stat-icon events">
                  ◫
                </div>

                <div>
                  <p>Total Events</p>

                  <h3>
                    {dashboardLoading
                      ? "..."
                      : totalEvents}
                  </h3>

                  <small>
                    Across all departments
                  </small>
                </div>

                <button
                  onClick={() =>
                    setActivePage("events")
                  }
                >
                  →
                </button>
              </article>


              {/* REGISTRATIONS */}

              <article>
                <div className="admin-stat-icon students">
                  👥
                </div>

                <div>
                  <p>Registrations</p>

                  <h3>
                    {dashboardLoading
                      ? "..."
                      : totalRegistrations}
                  </h3>

                  <small>
                    Total event registrations
                  </small>
                </div>

                <button
                  onClick={() =>
                    setActivePage(
                      "registrations"
                    )
                  }
                >
                  →
                </button>
              </article>


              {/* STUDENTS */}

              <article>
                <div className="admin-stat-icon students">
                  ◎
                </div>

                <div>
                  <p>Students</p>

                  <h3>
                    {dashboardLoading
                      ? "..."
                      : totalStudents}
                  </h3>

                  <small>
                    Registered student accounts
                  </small>
                </div>

                <button
                  onClick={() =>
                    setActivePage("students")
                  }
                >
                  →
                </button>
              </article>


              {/* COORDINATORS */}

              <article>
                <div className="admin-stat-icon coordinators">
                  ♟
                </div>

                <div>
                  <p>Coordinators</p>

                  <h3>
                    {dashboardLoading
                      ? "..."
                      : totalCoordinators}
                  </h3>

                  <small>
                    Coordinator accounts
                  </small>
                </div>

                <button
                  onClick={() =>
                    setActivePage(
                      "coordinators"
                    )
                  }
                >
                  →
                </button>
              </article>


              {/* CERTIFICATES */}

              <article>
                <div className="admin-stat-icon certificates">
                  ◇
                </div>

                <div>
                  <p>Certificates</p>

                  <h3>
                    {dashboardLoading
                      ? "..."
                      : totalCertificates}
                  </h3>

                  <small>
                    Total certificates issued
                  </small>
                </div>

                <button
                  onClick={() =>
                    setActivePage(
                      "certificates"
                    )
                  }
                >
                  →
                </button>
              </article>
            </section>


            {/* ==================================
                MAIN DASHBOARD GRID
            ================================== */}

            <section className="admin-dashboard-grid">

              {/* =================================
                  RECENT EVENTS
              ================================= */}

              <div className="admin-dashboard-panel">
                <div className="admin-panel-heading">
                  <div>
                    <p>ACTIVITY</p>
                    <h2>Recent Events</h2>
                  </div>

                  <button
                    onClick={() =>
                      setActivePage("events")
                    }
                  >
                    View all →
                  </button>
                </div>


                {dashboardLoading ? (
                  <div className="admin-empty-state">
                    <div>↻</div>

                    <h3>
                      Loading events...
                    </h3>

                    <p>
                      Fetching live activity from
                      MongoDB.
                    </p>
                  </div>
                ) : recentEvents.length === 0 ? (
                  <div className="admin-empty-state">
                    <div>◫</div>

                    <h3>
                      No events created yet
                    </h3>

                    <p>
                      Events created by admins and
                      coordinators will appear here.
                    </p>

                    <button
                      onClick={() =>
                        setActivePage("events")
                      }
                    >
                      Create First Event
                    </button>
                  </div>
                ) : (
                  <div className="admin-recent-events-list">
                    {recentEvents.map(
                      (event) => (
                        <article
                          key={event._id}
                          className="admin-recent-event-item"
                        >
                          <div className="admin-recent-event-icon">
                            ◫
                          </div>

                          <div className="admin-recent-event-info">
                            <strong>
                              {event.title}
                            </strong>

                            <span>
                              {event.category ||
                                "Event"}
                              {" • "}
                              {event.venue ||
                                "Venue not set"}
                            </span>

                            <small>
                              {formatEventDate(
                                event.date
                              )}
                            </small>
                          </div>

                          <div className="admin-recent-event-right">
                            <span
                              className={`admin-event-status ${
                                event.status
                                  ?.toLowerCase() ||
                                "upcoming"
                              }`}
                            >
                              {event.status ||
                                "Upcoming"}
                            </span>

                            <button
                              onClick={() =>
                                setActivePage(
                                  "events"
                                )
                              }
                            >
                              →
                            </button>
                          </div>
                        </article>
                      )
                    )}
                  </div>
                )}
              </div>


              {/* =================================
                  ADMIN CONTROLS
              ================================= */}

              <aside className="admin-control-panel">
                <div className="admin-panel-heading">
                  <div>
                    <p>QUICK ACCESS</p>
                    <h2>Admin Controls</h2>
                  </div>
                </div>


                <div className="admin-control-list">

                  <button
                    onClick={() =>
                      setActivePage("events")
                    }
                  >
                    <span className="control-icon">
                      ◫
                    </span>

                    <div>
                      <strong>
                        Manage Events
                      </strong>

                      <small>
                        Create, edit and publish
                      </small>
                    </div>

                    <b>→</b>
                  </button>


                  <button
                    onClick={() =>
                      setActivePage("students")
                    }
                  >
                    <span className="control-icon">
                      ◎
                    </span>

                    <div>
                      <strong>
                        Manage Students
                      </strong>

                      <small>
                        View and control accounts
                      </small>
                    </div>

                    <b>→</b>
                  </button>


                  <button
                    onClick={() =>
                      setActivePage(
                        "coordinators"
                      )
                    }
                  >
                    <span className="control-icon">
                      ♟
                    </span>

                    <div>
                      <strong>
                        Manage Coordinators
                      </strong>

                      <small>
                        Create and manage accounts
                      </small>
                    </div>

                    <b>→</b>
                  </button>


                  <button
                    onClick={() =>
                      setActivePage(
                        "registrations"
                      )
                    }
                  >
                    <span className="control-icon">
                      👥
                    </span>

                    <div>
                      <strong>
                        View Registrations
                      </strong>

                      <small>
                        Manage all participants
                      </small>
                    </div>

                    <b>→</b>
                  </button>


                  <button
                    onClick={() =>
                      setActivePage(
                        "certificates"
                      )
                    }
                  >
                    <span className="control-icon">
                      ◇
                    </span>

                    <div>
                      <strong>
                        Issue Certificates
                      </strong>

                      <small>
                        Manage event recognition
                      </small>
                    </div>

                    <b>→</b>
                  </button>
                </div>
              </aside>
            </section>


            {/* ==================================
                SYSTEM OVERVIEW
            ================================== */}

            <section className="admin-system-overview">
              <div className="admin-panel-heading">
                <div>
                  <p>PLATFORM</p>
                  <h2>System Overview</h2>
                </div>
              </div>


              <div className="admin-overview-grid">
                <article>
                  <span>✓</span>

                  <div>
                    <strong>
                      Event Management
                    </strong>

                    <small>Operational</small>
                  </div>
                </article>


                <article>
                  <span>✓</span>

                  <div>
                    <strong>
                      Student Registration
                    </strong>

                    <small>Operational</small>
                  </div>
                </article>


                <article>
                  <span>✓</span>

                  <div>
                    <strong>
                      Student Management
                    </strong>

                    <small>Operational</small>
                  </div>
                </article>


                <article>
                  <span>✓</span>

                  <div>
                    <strong>
                      Coordinator Portal
                    </strong>

                    <small>Operational</small>
                  </div>
                </article>


                <article>
                  <span>✓</span>

                  <div>
                    <strong>
                      Backend Integration
                    </strong>

                    <small>Connected</small>
                  </div>
                </article>
              </div>
            </section>
          </div>
        )}


        {/* ====================================
            EVENT MANAGEMENT PAGE
        ==================================== */}

        {activePage === "events" && (
          <div className="admin-content">
            <CoordinatorEvents />
          </div>
        )}


        {/* ====================================
            REGISTRATIONS PAGE
        ==================================== */}

        {activePage === "registrations" && (
          <div className="admin-content">
            <CoordinatorRegistrations />
          </div>
        )}


        {/* ====================================
            SEAT MANAGEMENT PAGE
        ==================================== */}

        {activePage === "seats" && (
          <div className="admin-content">
            <CoordinatorSeats />
          </div>
        )}


        {/* ====================================
            ATTENDANCE PAGE
        ==================================== */}

        {activePage === "attendance" && (
          <div className="admin-content">
            <CoordinatorAttendance />
          </div>
        )}


        {/* ====================================
            CERTIFICATES PAGE
        ==================================== */}

        {activePage === "certificates" && (
          <div className="admin-content">
            <CoordinatorCertificates />
          </div>
        )}


        {/* ====================================
            STUDENT MANAGEMENT PAGE
        ==================================== */}

        {activePage === "students" && (
          <div className="admin-content">
            <AdminStudents />
          </div>
        )}


        {/* ====================================
            COORDINATOR MANAGEMENT PAGE
        ==================================== */}

        {activePage === "coordinators" && (
          <div className="admin-content">
            <AdminCoordinators />
          </div>
        )}

      </main>
    </div>
  );
}


export default AdminDashboard;