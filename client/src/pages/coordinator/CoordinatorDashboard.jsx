import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import "./CoordinatorDashboard.css";

import GtecSphereLogo from "../../components/GtecSphereLogo.jsx";
import CoordinatorEvents from "./CoordinatorEvents.jsx";
import CoordinatorRegistrations from "./CoordinatorRegistrations.jsx";
import CoordinatorSeats from "./CoordinatorSeats.jsx";
import CoordinatorAttendance from "./CoordinatorAttendance.jsx";
import CoordinatorCertificates from "./CoordinatorCertificates.jsx";

const API_URL = "https://gtecsphere-backend.onrender.com/api";


function CoordinatorDashboard() {
  const navigate = useNavigate();

  const [activePage, setActivePage] =
    useState("dashboard");


  // ==========================================
  // EVENTS STATE
  // ==========================================

  const [events, setEvents] = useState([]);

  const [eventsLoading, setEventsLoading] =
    useState(true);

  const [eventsError, setEventsError] =
    useState("");


  // ==========================================
  // GET SAVED USER
  // ==========================================

  const savedUser =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user");

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
    "Coordinator";


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
  // MENU ITEMS
  // ==========================================

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
      icon: "◎",
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
  ];


  // ==========================================
  // PAGE TITLES
  // ==========================================

  const pageTitles = {
    dashboard: "Dashboard",
    events: "Event Management",
    registrations: "Registrations",
    seats: "Seat Management",
    attendance: "Attendance",
    certificates: "Certificates",
  };


  // ==========================================
  // FETCH ALL EVENTS
  // ==========================================

  const fetchEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      setEventsError("");

      const response = await fetch(
        `${API_URL}/events`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load events"
        );
      }

      setEvents(data.events || []);
    } catch (error) {
      console.error(
        "COORDINATOR DASHBOARD EVENTS ERROR:",
        error
      );

      setEventsError(error.message);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);


  // ==========================================
  // LOAD EVENTS
  // ==========================================

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);


  // ==========================================
  // REFRESH DASHBOARD
  // ==========================================

  useEffect(() => {
    if (activePage === "dashboard") {
      fetchEvents();
    }
  }, [activePage, fetchEvents]);


  // ==========================================
  // UPCOMING EVENTS
  // ==========================================

  const upcomingEvents = events
    .filter((event) => {
      if (!event?.date) {
        return false;
      }

      const eventDate =
        new Date(event.date);

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      return (
        !Number.isNaN(
          eventDate.getTime()
        ) &&
        eventDate >= today
      );
    })
    .sort(
      (first, second) =>
        new Date(first.date) -
        new Date(second.date)
    );


  // ==========================================
  // TOTAL REGISTRATIONS
  // ==========================================

  const totalRegistrations =
    events.reduce(
      (total, event) => {
        const count =
          event.participantCount ??
          event.participants?.length ??
          0;

        return total + count;
      },
      0
    );


  // ==========================================
  // TOTAL SEATS ASSIGNED
  // ==========================================

  const totalSeatsAssigned =
    events.reduce(
      (total, event) => {
        const count =
          event.participantCount ??
          event.participants?.length ??
          0;

        return total + count;
      },
      0
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

    if (Number.isNaN(date.getTime())) {
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
  // EVENT PARTICIPANT COUNT
  // ==========================================

  const getParticipantCount = (event) => {
    return (
      event.participantCount ??
      event.participants?.length ??
      0
    );
  };


  return (
    <div className="coordinator-app">

      {/* =====================================
          SIDEBAR
      ===================================== */}

      <aside className="coordinator-sidebar">

        <div className="coordinator-logo">

          <GtecSphereLogo
            size="small"
            variant="light"
            subtitle="IT COORDINATOR PORTAL"
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
              className={
                activePage === item.id
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActivePage(item.id)
              }
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


      {/* =====================================
          MAIN
      ===================================== */}

      <main className="coordinator-main">

        {/* =====================================
            TOP BAR
        ===================================== */}

        <header className="coordinator-topbar">

          <div>

            <p>
              INFORMATION TECHNOLOGY
            </p>

            <h2>
              {pageTitles[activePage]}
            </h2>

          </div>


          <div className="coordinator-topbar-actions">

            <button
              type="button"
              className="coordinator-notification"
            >
              ♢
              <span />
            </button>


            <div className="coordinator-profile">

              <span className="coordinator-avatar">
                {firstName
                  .charAt(0)
                  .toUpperCase()}
              </span>


              <div>

                <strong>
                  {user?.fullName ||
                    "Coordinator"}
                </strong>

                <small>
                  Information Technology
                </small>

              </div>

            </div>

          </div>

        </header>


        {/* =====================================
            DASHBOARD
        ===================================== */}

        {activePage === "dashboard" && (
          <div className="coordinator-content">

            {/* =====================================
                WELCOME
            ===================================== */}

            <section className="coordinator-welcome">

              <div>

                <p className="coordinator-welcome-label">
                  IT EVENT COMMAND CENTER
                </p>


                <h1>
                  Welcome back, {firstName} 👋
                </h1>


                <p>
                  Manage Information Technology
                  Department events, registrations,
                  seats, attendance and certificates
                  from one place.
                </p>


                <button
                  type="button"
                  onClick={() =>
                    setActivePage("events")
                  }
                >
                  Create New Event
                  <span>＋</span>
                </button>

              </div>


              <div className="coordinator-welcome-decoration">
                <span>IT</span>
              </div>

            </section>


            {/* =====================================
                ERROR MESSAGE
            ===================================== */}

            {eventsError && (
              <section className="coordinator-error-box">

                <strong>
                  Dashboard connection error
                </strong>

                <p>
                  {eventsError}
                </p>

                <button
                  type="button"
                  onClick={fetchEvents}
                >
                  Retry
                </button>

              </section>
            )}


            {/* =====================================
                STATS
            ===================================== */}

            <section className="coordinator-stats">

              {/* TOTAL EVENTS */}

              <article className="coordinator-stat-card">

                <div className="coordinator-stat-icon">
                  ◫
                </div>

                <div>

                  <p>Total Events</p>

                  <h3>
                    {eventsLoading
                      ? "..."
                      : events.length}
                  </h3>

                  <small>
                    IT Department events
                  </small>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setActivePage("events")
                  }
                >
                  →
                </button>

              </article>


              {/* REGISTRATIONS */}

              <article className="coordinator-stat-card">

                <div className="coordinator-stat-icon">
                  ◎
                </div>

                <div>

                  <p>Registrations</p>

                  <h3>
                    {eventsLoading
                      ? "..."
                      : totalRegistrations}
                  </h3>

                  <small>
                    Total student registrations
                  </small>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setActivePage(
                      "registrations"
                    )
                  }
                >
                  →
                </button>

              </article>


              {/* SEATS */}

              <article className="coordinator-stat-card">

                <div className="coordinator-stat-icon">
                  ▦
                </div>

                <div>

                  <p>Seats Assigned</p>

                  <h3>
                    {eventsLoading
                      ? "..."
                      : totalSeatsAssigned}
                  </h3>

                  <small>
                    Across all IT events
                  </small>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setActivePage("seats")
                  }
                >
                  →
                </button>

              </article>


              {/* UPCOMING EVENTS */}

              <article className="coordinator-stat-card">

                <div className="coordinator-stat-icon">
                  ◇
                </div>

                <div>

                  <p>Upcoming Events</p>

                  <h3>
                    {eventsLoading
                      ? "..."
                      : upcomingEvents.length}
                  </h3>

                  <small>
                    Scheduled IT events
                  </small>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setActivePage("events")
                  }
                >
                  →
                </button>

              </article>

            </section>


            {/* =====================================
                MAIN GRID
            ===================================== */}

            <section className="coordinator-dashboard-grid">

              {/* =====================================
                  UPCOMING EVENTS PANEL
              ===================================== */}

              <div className="coordinator-panel">

                <div className="coordinator-section-heading">

                  <div>

                    <p>MANAGE</p>

                    <h2>
                      Upcoming Events
                    </h2>

                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      setActivePage("events")
                    }
                  >
                    View all →
                  </button>

                </div>


                {/* =====================================
                    LOADING
                ===================================== */}

                {eventsLoading && (
                  <div className="coordinator-empty-state">

                    <div>◷</div>

                    <h3>
                      Loading events...
                    </h3>

                  </div>
                )}


                {/* =====================================
                    EVENTS AVAILABLE
                ===================================== */}

                {!eventsLoading &&
                  !eventsError &&
                  upcomingEvents.length > 0 && (

                    <div className="coordinator-upcoming-events-list">

                      {upcomingEvents
                        .slice(0, 4)
                        .map((event) => (

                          <article
                            key={event._id}
                            className="coordinator-upcoming-event"
                          >

                            {/* DATE */}

                            <div className="coordinator-event-date">

                              <strong>
                                {new Date(event.date)
                                  .getDate()
                                  .toString()
                                  .padStart(2, "0")}
                              </strong>


                              <span>
                                {new Date(event.date)
                                  .toLocaleString(
                                    "en-US",
                                    {
                                      month: "short",
                                    }
                                  )
                                  .toUpperCase()}
                              </span>

                            </div>


                            {/* EVENT INFO */}

                            <div className="coordinator-event-info">

                              <small className="coordinator-event-category">
                                {event.category ||
                                  "IT EVENT"}
                              </small>


                              <h3>
                                {event.title}
                              </h3>


                              <p>

                                <span>
                                  {formatDate(
                                    event.date
                                  )}
                                </span>

                                <span className="coordinator-event-separator">
                                  •
                                </span>

                                <span>
                                  {event.time ||
                                    "Time not specified"}
                                </span>

                                <span className="coordinator-event-separator">
                                  •
                                </span>

                                <span>
                                  {event.venue ||
                                    "Venue not specified"}
                                </span>

                              </p>

                            </div>


                            {/* PARTICIPANTS */}

                            <div className="coordinator-event-participants">

                              <strong>
                                {getParticipantCount(
                                  event
                                )}
                              </strong>

                              <small>
                                Registrations
                              </small>

                            </div>


                            {/* ARROW */}

                            <button
                              type="button"
                              className="coordinator-event-arrow"
                              onClick={() =>
                                setActivePage(
                                  "events"
                                )
                              }
                              aria-label={`Open ${event.title}`}
                            >
                              →
                            </button>

                          </article>
                        ))}

                    </div>
                  )}


                {/* =====================================
                    EMPTY
                ===================================== */}

                {!eventsLoading &&
                  !eventsError &&
                  upcomingEvents.length === 0 && (

                    <div className="coordinator-empty-state">

                      <div>◫</div>

                      <h3>
                        No upcoming events
                      </h3>


                      <p>
                        Create the first Information
                        Technology Department event
                        and start accepting student
                        registrations.
                      </p>


                      <button
                        type="button"
                        onClick={() =>
                          setActivePage("events")
                        }
                      >
                        ＋ Create Event
                      </button>

                    </div>
                  )}

              </div>


              {/* =====================================
                  QUICK ACTIONS
              ===================================== */}

              <aside className="coordinator-quick-actions">

                <div className="coordinator-section-heading">

                  <div>

                    <p>SHORTCUTS</p>

                    <h2>
                      Quick Actions
                    </h2>

                  </div>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setActivePage("events")
                  }
                >

                  <span>◫</span>

                  <div>

                    <strong>
                      Create Event
                    </strong>

                    <small>
                      Publish a new IT event
                    </small>

                  </div>

                  <b>→</b>

                </button>


                <button
                  type="button"
                  onClick={() =>
                    setActivePage(
                      "registrations"
                    )
                  }
                >

                  <span>◎</span>

                  <div>

                    <strong>
                      View Registrations
                    </strong>

                    <small>
                      See registered students
                    </small>

                  </div>

                  <b>→</b>

                </button>


                <button
                  type="button"
                  onClick={() =>
                    setActivePage("seats")
                  }
                >

                  <span>▦</span>

                  <div>

                    <strong>
                      Assign Seats
                    </strong>

                    <small>
                      Manage event seating
                    </small>

                  </div>

                  <b>→</b>

                </button>


                <button
                  type="button"
                  onClick={() =>
                    setActivePage(
                      "attendance"
                    )
                  }
                >

                  <span>✓</span>

                  <div>

                    <strong>
                      Mark Attendance
                    </strong>

                    <small>
                      Track event participation
                    </small>

                  </div>

                  <b>→</b>

                </button>

              </aside>

            </section>


            {/* =====================================
                ACTIVITY
            ===================================== */}

            <section className="coordinator-activity-panel">

              <div className="coordinator-section-heading">

                <div>

                  <p>RECENT</p>

                  <h2>
                    Activity
                  </h2>

                </div>

              </div>


              {events.length > 0 ? (

                <div className="coordinator-empty-activity">

                  <span>◫</span>

                  <div>

                    <h3>
                      {events[0]?.title}
                    </h3>

                    <p>
                      Latest IT Department event
                      available in GtecSphere.
                    </p>

                  </div>

                </div>

              ) : (

                <div className="coordinator-empty-activity">

                  <span>⌁</span>

                  <div>

                    <h3>
                      No recent activity
                    </h3>

                    <p>
                      IT Department event updates
                      and management activity will
                      appear here.
                    </p>

                  </div>

                </div>
              )}

            </section>

          </div>
        )}


        {/* =====================================
            EVENTS PAGE
        ===================================== */}

        {activePage === "events" && (
          <div className="coordinator-content">

            <CoordinatorEvents />

          </div>
        )}


        {/* =====================================
            REGISTRATIONS PAGE
        ===================================== */}

        {activePage === "registrations" && (
          <div className="coordinator-content">

            <CoordinatorRegistrations />

          </div>
        )}


        {/* =====================================
            SEAT MANAGEMENT PAGE
        ===================================== */}

        {activePage === "seats" && (
          <div className="coordinator-content">

            <CoordinatorSeats />

          </div>
        )}


        {/* =====================================
            ATTENDANCE PAGE
        ===================================== */}

        {activePage === "attendance" && (
          <div className="coordinator-content">

            <CoordinatorAttendance />

          </div>
        )}


        {/* =====================================
            CERTIFICATES PAGE
        ===================================== */}

        {activePage === "certificates" && (
          <div className="coordinator-content">

            <CoordinatorCertificates />

          </div>
        )}

      </main>

    </div>
  );
}


export default CoordinatorDashboard;