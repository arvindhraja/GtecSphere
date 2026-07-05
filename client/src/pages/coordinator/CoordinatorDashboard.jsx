import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CoordinatorDashboard.css";
import GtecSphereLogo from "../../components/GtecSphereLogo.jsx";
import CoordinatorEvents from "./CoordinatorEvents.jsx";
import CoordinatorRegistrations from "./CoordinatorRegistrations.jsx";  
import CoordinatorSeats from "./CoordinatorSeats.jsx";
import CoordinatorAttendance from "./CoordinatorAttendance.jsx";
import CoordinatorCertificates from "./CoordinatorCertificates.jsx";
import CoordinatorOpportunities from "./CoordinatorOpportunities.jsx";

function CoordinatorDashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("dashboard");

  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : {};

  const firstName = user?.fullName?.split(" ")[0] || "Coordinator";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const menuItems = [
    { id: "dashboard", icon: "⌂", label: "Dashboard" },
    { id: "events", icon: "◫", label: "Events" },
    { id: "registrations", icon: "◎", label: "Registrations" },
    { id: "seats", icon: "▦", label: "Seat Management" },
    { id: "attendance", icon: "✓", label: "Attendance" },
    { id: "certificates", icon: "◇", label: "Certificates" },
    { id: "opportunities", icon: "↗", label: "Opportunities" },
  ];

  const pageTitles = {
    dashboard: "Dashboard",
    events: "Event Management",
    registrations: "Registrations",
    seats: "Seat Management",
    attendance: "Attendance",
    certificates: "Certificates",
  };

  return (
    <div className="coordinator-app">
      {/* SIDEBAR */}
      <aside className="coordinator-sidebar">
        <div className="coordinator-logo">
  <GtecSphereLogo
    size="small"
    variant="light"
    subtitle="COORDINATOR"
  />
</div>

        <div className="coordinator-role-badge">
          <span>📋</span>

          <div>
            <small>PORTAL</small>
            <strong>Coordinator</strong>
          </div>
        </div>

        <nav className="coordinator-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={activePage === item.id ? "active" : ""}
              onClick={() => setActivePage(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="coordinator-sidebar-bottom">
          <button
            className="coordinator-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="coordinator-main">
        {/* TOP BAR */}
        <header className="coordinator-topbar">
          <div>
            <p>COORDINATOR PORTAL</p>
            <h2>{pageTitles[activePage]}</h2>
          </div>

          <div className="coordinator-topbar-actions">
            <button className="coordinator-notification">
              ♢
              <span />
            </button>

            <div className="coordinator-profile">
              <span className="coordinator-avatar">
                {firstName.charAt(0).toUpperCase()}
              </span>

              <div>
                <strong>
                  {user?.fullName || "Coordinator"}
                </strong>

                <small>
                  {user?.department || "Coordinator"}
                </small>
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD */}
        {activePage === "dashboard" && (
          <div className="coordinator-content">
            {/* WELCOME */}
            <section className="coordinator-welcome">
              <div>
                <p className="coordinator-welcome-label">
                  EVENT COMMAND CENTER
                </p>

                <h1>
                  Welcome back, {firstName} 👋
                </h1>

                <p>
                  Manage campus events, registrations, seats,
                  attendance and certificates from one place.
                </p>

                <button
                  onClick={() => setActivePage("events")}
                >
                  Create New Event
                  <span>＋</span>
                </button>
              </div>

              <div className="coordinator-welcome-decoration">
                <span>G</span>
              </div>
            </section>

            {/* STATS */}
            <section className="coordinator-stats">
              <article className="coordinator-stat-card">
                <div className="coordinator-stat-icon">
                  ◫
                </div>

                <div>
                  <p>Total Events</p>
                  <h3>0</h3>
                  <small>Events managed</small>
                </div>

                <button
                  onClick={() => setActivePage("events")}
                >
                  →
                </button>
              </article>

              <article className="coordinator-stat-card">
                <div className="coordinator-stat-icon">
                  ◎
                </div>

                <div>
                  <p>Registrations</p>
                  <h3>0</h3>
                  <small>Total students</small>
                </div>

                <button
                  onClick={() =>
                    setActivePage("registrations")
                  }
                >
                  →
                </button>
              </article>

              <article className="coordinator-stat-card">
                <div className="coordinator-stat-icon">
                  ▦
                </div>

                <div>
                  <p>Seats Assigned</p>
                  <h3>0</h3>
                  <small>Across all events</small>
                </div>

                <button
                  onClick={() => setActivePage("seats")}
                >
                  →
                </button>
              </article>

              <article className="coordinator-stat-card">
                <div className="coordinator-stat-icon">
                  ◇
                </div>

                <div>
                  <p>Certificates</p>
                  <h3>0</h3>
                  <small>Issued to students</small>
                </div>

                <button
                  onClick={() =>
                    setActivePage("certificates")
                  }
                >
                  →
                </button>
              </article>
            </section>

            {/* MAIN GRID */}
            <section className="coordinator-dashboard-grid">
              {/* EVENTS */}
              <div className="coordinator-panel">
                <div className="coordinator-section-heading">
                  <div>
                    <p>MANAGE</p>
                    <h2>Upcoming Events</h2>
                  </div>

                  <button
                    onClick={() => setActivePage("events")}
                  >
                    View all →
                  </button>
                </div>

                <div className="coordinator-empty-state">
                  <div>◫</div>

                  <h3>No events created yet</h3>

                  <p>
                    Create your first campus event and start
                    accepting student registrations.
                  </p>

                  <button
                    onClick={() => setActivePage("events")}
                  >
                    ＋ Create Event
                  </button>
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <aside className="coordinator-quick-actions">
                <div className="coordinator-section-heading">
                  <div>
                    <p>SHORTCUTS</p>
                    <h2>Quick Actions</h2>
                  </div>
                </div>

                <button
                  onClick={() => setActivePage("events")}
                >
                  <span>◫</span>

                  <div>
                    <strong>Create Event</strong>
                    <small>
                      Publish a new campus event
                    </small>
                  </div>

                  <b>→</b>
                </button>

                <button
                  onClick={() =>
                    setActivePage("registrations")
                  }
                >
                  <span>◎</span>

                  <div>
                    <strong>View Registrations</strong>
                    <small>
                      See registered students
                    </small>
                  </div>

                  <b>→</b>
                </button>

                <button
                  onClick={() => setActivePage("seats")}
                >
                  <span>▦</span>

                  <div>
                    <strong>Assign Seats</strong>
                    <small>
                      Manage event seating
                    </small>
                  </div>

                  <b>→</b>
                </button>

                <button
                  onClick={() =>
                    setActivePage("attendance")
                  }
                >
                  <span>✓</span>

                  <div>
                    <strong>Mark Attendance</strong>
                    <small>
                      Track event participation
                    </small>
                  </div>

                  <b>→</b>
                </button>
              </aside>
            </section>

            {/* ACTIVITY */}
            <section className="coordinator-activity-panel">
              <div className="coordinator-section-heading">
                <div>
                  <p>RECENT</p>
                  <h2>Activity</h2>
                </div>
              </div>

              <div className="coordinator-empty-activity">
                <span>⌁</span>

                <div>
                  <h3>No recent activity</h3>

                  <p>
                    Event updates and management activity will
                    appear here.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

                                {/* EVENTS PAGE */}
        {activePage === "events" && (
          <div className="coordinator-content">
            <CoordinatorEvents />
          </div>
        )}

        {/* REGISTRATIONS PAGE */}
        {activePage === "registrations" && (
          <div className="coordinator-content">
            <CoordinatorRegistrations />
          </div>
        )}

        {/* SEAT MANAGEMENT PAGE */}
{activePage === "seats" && (
  <div className="coordinator-content">
    <CoordinatorSeats />
  </div>
)}

{/* ATTENDANCE PAGE */}
{activePage === "attendance" && (
  <div className="coordinator-content">
    <CoordinatorAttendance />
  </div>
)}

{/* CERTIFICATES PAGE */}
{activePage === "certificates" && (
  <div className="coordinator-content">
    <CoordinatorCertificates />
  </div>
)}

{/* OPPORTUNITIES PAGE */}
{activePage === "opportunities" && (
  <div className="coordinator-content">
    <CoordinatorOpportunities />
  </div>
)}

{/* OTHER TEMPORARY PAGES */}
{activePage !== "dashboard" &&
  activePage !== "events" &&
  activePage !== "registrations" &&
  activePage !== "seats" &&
  activePage !== "attendance" &&
  activePage !== "certificates" &&
  activePage !== "opportunities" && (
    <div className="coordinator-content">
      <div className="coordinator-page-placeholder">
        <div>
          {menuItems.find(
            (item) => item.id === activePage
          )?.icon || "○"}
        </div>

        <h2>{pageTitles[activePage]}</h2>

        <p>
          This coordinator module will be built in the next step.
        </p>
      </div>
    </div>
  )}
                </main>
    </div>
  );
}

export default CoordinatorDashboard;