import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./StudentEvents.css";

const API_URL = "https://gtecsphere-backend.onrender.com/api";

const categories = [
  "All",
  "Workshop",
  "Hackathon",
  "Seminar",
  "Cultural",
  "Sports",
];

const emptyMember = {
  name: "",
  registerNumber: "",
  department: "",
  year: "",
  email: "",
  phone: "",
};

const initialRegistrationForm = {
  registrationType: "Individual",
  teamName: "",
  teamMembers: [],
  projectTitle: "",
  projectDescription: "",
};

function StudentEvents() {
  const [events, setEvents] = useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [activeCategory, setActiveCategory] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [registeredEventIds, setRegisteredEventIds] =
    useState([]);

  const [selectedEvent, setSelectedEvent] =
    useState(null);

  const [showRegistrationModal, setShowRegistrationModal] =
    useState(false);

  const [registrationForm, setRegistrationForm] =
    useState(initialRegistrationForm);

  const [registering, setRegistering] =
    useState(false);

  const [acknowledgement, setAcknowledgement] =
    useState(null);


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
  // LOAD ALL PUBLISHED EVENTS
  // ==========================================
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/events`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load events"
        );
      }

      const backendEvents =
        data.events ||
        data.data ||
        [];

      const visibleEvents =
        backendEvents.filter(
          (event) =>
            event.status !== "Completed" &&
            event.status !== "Cancelled" &&
            event.publicationStatus ===
              "Published"
        );

      setEvents(visibleEvents);
    } catch (error) {
      console.error(
        "FETCH STUDENT EVENTS ERROR:",
        error
      );

      setError(error.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // LOAD MY REGISTRATIONS
  // ==========================================
  const fetchMyRegistrations = async () => {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

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
        return;
      }

      const registrations =
        data.registrations || [];

      const activeRegistrations =
        registrations.filter(
          (registration) =>
            registration.status !==
            "Cancelled"
        );

      const ids =
        activeRegistrations
          .map((registration) => {
            if (
              registration.event?._id
            ) {
              return registration.event._id;
            }

            return registration.event;
          })
          .filter(Boolean);

      setRegisteredEventIds(ids);
    } catch (error) {
      console.error(
        "FETCH MY REGISTRATIONS ERROR:",
        error
      );
    }
  };


  // ==========================================
  // INITIAL LOAD
  // ==========================================
  useEffect(() => {
    fetchEvents();
    fetchMyRegistrations();
  }, []);


  // ==========================================
  // OPEN REGISTRATION FORM
  // ==========================================
  const openRegistrationModal = (
    eventItem
  ) => {
    setSelectedEvent(eventItem);

    setRegistrationForm(
      initialRegistrationForm
    );

    setAcknowledgement(null);

    setShowRegistrationModal(true);
  };


  // ==========================================
  // CLOSE REGISTRATION FORM
  // ==========================================
  const closeRegistrationModal = () => {
    if (registering) {
      return;
    }

    setShowRegistrationModal(false);
    setSelectedEvent(null);

    setRegistrationForm(
      initialRegistrationForm
    );

    setAcknowledgement(null);
  };


  // ==========================================
  // HANDLE MAIN FORM CHANGE
  // ==========================================
  const handleRegistrationChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    if (name === "registrationType") {
      setRegistrationForm(
        (previous) => ({
          ...previous,

          registrationType: value,

          teamName:
            value === "Team"
              ? previous.teamName
              : "",

          teamMembers:
            value === "Team"
              ? previous.teamMembers
              : [],
        })
      );

      return;
    }

    setRegistrationForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };


  // ==========================================
  // ADD TEAM MEMBER
  // ==========================================
  const addTeamMember = () => {
    setRegistrationForm(
      (previous) => ({
        ...previous,

        teamMembers: [
          ...previous.teamMembers,
          {
            ...emptyMember,
          },
        ],
      })
    );
  };


  // ==========================================
  // UPDATE TEAM MEMBER
  // ==========================================
  const updateTeamMember = (
    index,
    field,
    value
  ) => {
    setRegistrationForm(
      (previous) => ({
        ...previous,

        teamMembers:
          previous.teamMembers.map(
            (member, memberIndex) =>
              memberIndex === index
                ? {
                    ...member,
                    [field]: value,
                  }
                : member
          ),
      })
    );
  };


  // ==========================================
  // REMOVE TEAM MEMBER
  // ==========================================
  const removeTeamMember = (
    index
  ) => {
    setRegistrationForm(
      (previous) => ({
        ...previous,

        teamMembers:
          previous.teamMembers.filter(
            (_, memberIndex) =>
              memberIndex !== index
          ),
      })
    );
  };


  // ==========================================
  // SUBMIT REGISTRATION
  // ==========================================
  const handleRegistrationSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedEvent) {
      return;
    }

    if (
      registrationForm.registrationType ===
      "Team"
    ) {
      if (
        !registrationForm.teamName.trim()
      ) {
        alert(
          "Please enter your team name."
        );

        return;
      }

      if (
        registrationForm.teamMembers
          .length === 0
      ) {
        alert(
          "Please add at least one team member."
        );

        return;
      }

      const invalidMember =
        registrationForm.teamMembers.some(
          (member) =>
            !member.name.trim() ||
            !member.registerNumber.trim()
        );

      if (invalidMember) {
        alert(
          "Every team member needs a name and register number."
        );

        return;
      }
    }

    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Please login again to register."
        );
      }

      setRegistering(true);

      const eventId =
        selectedEvent._id ||
        selectedEvent.id;

      const response = await fetch(
        `${API_URL}/registrations/${eventId}`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            registrationForm
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to register for event"
        );
      }

      setRegisteredEventIds(
        (previousIds) => [
          ...new Set([
            ...previousIds,
            eventId,
          ]),
        ]
      );

      setAcknowledgement({
        acknowledgementNumber:
          data.acknowledgement
            ?.acknowledgementNumber ||
          data.registration
            ?.acknowledgementNumber,

        registrationType:
          data.registration
            ?.registrationType ||
          registrationForm.registrationType,

        teamName:
          data.registration?.teamName ||
          registrationForm.teamName,

        status:
          data.registration?.status ||
          "Registered",

        eventTitle:
          selectedEvent.title,
      });

      await fetchMyRegistrations();
    } catch (error) {
      console.error(
        "EVENT REGISTRATION ERROR:",
        error
      );

      alert(error.message);
    } finally {
      setRegistering(false);
    }
  };


  // ==========================================
  // FORMAT EVENT DATE
  // ==========================================
  const formatEventDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return {
        day: "--",
        month: "---",
      };
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(date.getTime())
    ) {
      return {
        day: "--",
        month: "---",
      };
    }

    return {
      day: date
        .getDate()
        .toString()
        .padStart(2, "0"),

      month: date
        .toLocaleString(
          "en-US",
          {
            month: "short",
          }
        )
        .toUpperCase(),
    };
  };


  // ==========================================
  // FILTER EVENTS
  // ==========================================
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const search =
        searchTerm
          .toLowerCase()
          .trim();

      const title = (
        event.title || ""
      ).toLowerCase();

      const venue = (
        event.venue || ""
      ).toLowerCase();

      const department = (
        event.department || ""
      ).toLowerCase();

      const matchesSearch =
        title.includes(search) ||
        venue.includes(search) ||
        department.includes(search);

      const matchesCategory =
        activeCategory === "All" ||
        event.category ===
          activeCategory;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    events,
    searchTerm,
    activeCategory,
  ]);


  return (
    <div className="events-page">

      {/* HERO */}

      <section className="events-hero">
        <div className="events-hero-content">
          <p className="events-eyebrow">
            DISCOVER YOUR CAMPUS
          </p>

          <h1>
            Find your next
            <span> experience.</span>
          </h1>

          <p>
            Explore workshops,
            hackathons, seminars and
            everything happening across
            your campus.
          </p>
        </div>

        <div className="events-hero-decoration">
          <span>◫</span>
        </div>
      </section>


      {/* SEARCH + FILTER */}

      <section className="events-controls">
        <div className="events-search">
          <span>⌕</span>

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Search events, venue or department..."
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() =>
                setSearchTerm("")
              }
            >
              ×
            </button>
          )}
        </div>

        <div className="category-filters">
          {categories.map(
            (category) => (
              <button
                type="button"
                key={category}
                className={
                  activeCategory ===
                  category
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveCategory(
                    category
                  )
                }
              >
                {category}
              </button>
            )
          )}
        </div>
      </section>


      {/* RESULTS */}

      <section className="events-results">
        <div className="events-section-heading">
          <div>
            <p>EXPLORE</p>

            <h2>
              {activeCategory === "All"
                ? "Upcoming Events"
                : `${activeCategory} Events`}
            </h2>
          </div>

          <span>
            {filteredEvents.length}{" "}
            {filteredEvents.length === 1
              ? "event"
              : "events"}
          </span>
        </div>


        {loading && (
          <div className="events-empty-state">
            <div>◷</div>

            <h3>
              Loading events...
            </h3>

            <p>
              Getting the latest events
              from GtecSphere.
            </p>
          </div>
        )}


        {!loading && error && (
          <div className="events-empty-state">
            <div>!</div>

            <h3>
              Unable to load events
            </h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={fetchEvents}
            >
              Try Again
            </button>
          </div>
        )}


        {!loading &&
          !error &&
          filteredEvents.length > 0 && (
            <div className="events-grid">
              {filteredEvents.map(
                (eventItem) => {
                  const eventDate =
                    formatEventDate(
                      eventItem.date
                    );

                  const eventId =
                    eventItem._id ||
                    eventItem.id;

                  const isRegistered =
                    registeredEventIds.includes(
                      eventId
                    );

                  return (
                    <article
                      className="event-card"
                      key={eventId}
                    >
                      <div className="event-card-top">
                        <span className="event-category">
                          {eventItem.category ||
                            "Event"}
                        </span>

                        <span className="event-department">
                          {eventItem.department ||
                            "CAMPUS"}
                        </span>
                      </div>

                      <div className="event-date">
                        <strong>
                          {eventDate.day}
                        </strong>

                        <span>
                          {eventDate.month}
                        </span>
                      </div>

                      <div className="event-card-content">
                        <h3>
                          {eventItem.title ||
                            "Untitled Event"}
                        </h3>

                        <p className="event-description">
                          {eventItem.description ||
                            "No description available."}
                        </p>

                        <div className="event-meta">
                          <div>
                            <span>◷</span>

                            <p>
                              <small>
                                TIME
                              </small>

                              <strong>
                                {eventItem.time ||
                                  "Not specified"}
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
                                {eventItem.venue ||
                                  "Not specified"}
                              </strong>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="event-card-footer">
                        <button
                          type="button"
                          className="event-details-button"
                        >
                          View Details
                        </button>

                        <button
                          type="button"
                          className="event-register-button"
                          disabled={
                            isRegistered
                          }
                          onClick={() =>
                            openRegistrationModal(
                              eventItem
                            )
                          }
                        >
                          {isRegistered
                            ? "Registered ✓"
                            : "Register"}

                          {!isRegistered && (
                            <span>→</span>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}


        {!loading &&
          !error &&
          filteredEvents.length === 0 && (
            <div className="events-empty-state">
              <div>⌕</div>

              <h3>
                No events found
              </h3>

              <p>
                Try another search or
                choose a different
                category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setActiveCategory(
                    "All"
                  );
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
      </section>


      {/* REGISTRATION MODAL */}

      {showRegistrationModal && (
        <div className="registration-modal-overlay">
          <div className="registration-modal">

            {!acknowledgement ? (
              <>
                <div className="registration-modal-header">
                  <div>
                    <p>
                      EVENT REGISTRATION
                    </p>

                    <h2>
                      {selectedEvent?.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={
                      closeRegistrationModal
                    }
                  >
                    ×
                  </button>
                </div>


                <form
                  className="registration-form"
                  onSubmit={
                    handleRegistrationSubmit
                  }
                >
                  <div className="registration-type-options">
                    <button
                      type="button"
                      className={
                        registrationForm.registrationType ===
                        "Individual"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setRegistrationForm(
                          (previous) => ({
                            ...previous,
                            registrationType:
                              "Individual",
                            teamName: "",
                            teamMembers: [],
                          })
                        )
                      }
                    >
                      👤 Individual
                    </button>

                    <button
                      type="button"
                      className={
                        registrationForm.registrationType ===
                        "Team"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setRegistrationForm(
                          (previous) => ({
                            ...previous,
                            registrationType:
                              "Team",
                          })
                        )
                      }
                    >
                      👥 Team
                    </button>
                  </div>


                  {registrationForm.registrationType ===
                    "Team" && (
                    <>
                      <div className="registration-field">
                        <label>
                          Team Name *
                        </label>

                        <input
                          type="text"
                          name="teamName"
                          value={
                            registrationForm.teamName
                          }
                          onChange={
                            handleRegistrationChange
                          }
                          placeholder="Example: Cyber Pirates"
                        />
                      </div>


                      <div className="team-members-section">
                        <div className="team-members-heading">
                          <div>
                            <h3>
                              Team Members
                            </h3>

                            <p>
                              Add members other
                              than the logged-in
                              team leader.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={
                              addTeamMember
                            }
                          >
                            ＋ Add Member
                          </button>
                        </div>


                        {registrationForm.teamMembers.length ===
                          0 && (
                          <div className="no-team-members">
                            No team members
                            added yet.
                          </div>
                        )}


                        {registrationForm.teamMembers.map(
                          (
                            member,
                            index
                          ) => (
                            <div
                              className="team-member-card"
                              key={index}
                            >
                              <div className="team-member-card-header">
                                <strong>
                                  Member{" "}
                                  {index + 1}
                                </strong>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeTeamMember(
                                      index
                                    )
                                  }
                                >
                                  ×
                                </button>
                              </div>

                              <div className="team-member-grid">
                                <div className="registration-field">
                                  <label>
                                    Name *
                                  </label>

                                  <input
                                    type="text"
                                    value={
                                      member.name
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateTeamMember(
                                        index,
                                        "name",
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                  />
                                </div>

                                <div className="registration-field">
                                  <label>
                                    Register
                                    Number *
                                  </label>

                                  <input
                                    type="text"
                                    value={
                                      member.registerNumber
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateTeamMember(
                                        index,
                                        "registerNumber",
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                  />
                                </div>

                                <div className="registration-field">
                                  <label>
                                    Department
                                  </label>

                                  <input
                                    type="text"
                                    value={
                                      member.department
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateTeamMember(
                                        index,
                                        "department",
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                  />
                                </div>

                                <div className="registration-field">
                                  <label>
                                    Year
                                  </label>

                                  <input
                                    type="text"
                                    value={
                                      member.year
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateTeamMember(
                                        index,
                                        "year",
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </>
                  )}


                  <div className="registration-field">
                    <label>
                      Project / Topic Title
                    </label>

                    <input
                      type="text"
                      name="projectTitle"
                      value={
                        registrationForm.projectTitle
                      }
                      onChange={
                        handleRegistrationChange
                      }
                      placeholder="Optional project or topic title"
                    />
                  </div>


                  <div className="registration-field">
                    <label>
                      Project / Topic Description
                    </label>

                    <textarea
                      name="projectDescription"
                      rows="4"
                      value={
                        registrationForm.projectDescription
                      }
                      onChange={
                        handleRegistrationChange
                      }
                      placeholder="Tell us briefly about your project or topic..."
                    />
                  </div>


                  <div className="registration-form-actions">
                    <button
                      type="button"
                      onClick={
                        closeRegistrationModal
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={registering}
                    >
                      {registering
                        ? "Submitting..."
                        : "Confirm Registration"}
                    </button>
                  </div>
                </form>
              </>
            ) : (

              /* ACKNOWLEDGEMENT */

              <div className="acknowledgement-card">
                <div className="acknowledgement-success-icon">
                  ✓
                </div>

                <p className="acknowledgement-eyebrow">
                  REGISTRATION SUCCESSFUL
                </p>

                <h2>
                  You're registered!
                </h2>

                <p>
                  Your registration has
                  been saved successfully.
                </p>

                <div className="acknowledgement-number">
                  <small>
                    ACKNOWLEDGEMENT NUMBER
                  </small>

                  <strong>
                    {acknowledgement
                      .acknowledgementNumber}
                  </strong>
                </div>

                <div className="acknowledgement-details">
                  <div>
                    <span>Event</span>

                    <strong>
                      {acknowledgement
                        .eventTitle}
                    </strong>
                  </div>

                  <div>
                    <span>Type</span>

                    <strong>
                      {acknowledgement
                        .registrationType}
                    </strong>
                  </div>

                  {acknowledgement
                    .teamName && (
                    <div>
                      <span>Team</span>

                      <strong>
                        {acknowledgement
                          .teamName}
                      </strong>
                    </div>
                  )}

                  <div>
                    <span>Status</span>

                    <strong>
                      {acknowledgement
                        .status}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="acknowledgement-done-button"
                  onClick={
                    closeRegistrationModal
                  }
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentEvents;