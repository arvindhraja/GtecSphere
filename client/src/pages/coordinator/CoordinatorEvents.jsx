import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./CoordinatorEvents.css";

const API_URL = "http://gtecsphere-backend.onrender.com/api";

const initialForm = {
  title: "",
  category: "",
  description: "",
  venue: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  registrationDeadline: "",
  capacity: "",
  status: "draft",
};

function CoordinatorEvents() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] =
    useState(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [formData, setFormData] =
    useState(initialForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

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
  // CONVERT BACKEND EVENT FOR FRONTEND UI
  // ==========================================
  const normalizeEvent = (event) => {
    let frontendStatus = "published";

    if (event.publicationStatus === "Draft") {
      frontendStatus = "draft";
    } else if (
      event.status === "Completed" ||
      event.status === "Cancelled"
    ) {
      frontendStatus = "closed";
    }

    return {
      ...event,

      id: event._id || event.id,

      eventDate:
        event.date ||
        event.eventDate ||
        "",

      startTime:
        event.time ||
        event.startTime ||
        "",

      endTime:
        event.endTime || "",

      registrationDeadline:
        event.registrationDeadline || "",

      capacity:
        event.maxParticipants ??
        event.capacity ??
        0,

      registeredCount:
        event.participantCount ??
        event.registrationCount ??
        event.participants?.length ??
        0,

      frontendStatus,
    };
  };

  // ==========================================
  // LOAD ALL EVENTS FROM MONGODB
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
            "Unable to load events"
        );
      }

      const backendEvents =
        data.events ||
        data.data ||
        [];

      setEvents(
        backendEvents.map(normalizeEvent)
      );
    } catch (error) {
      console.error(
        "FETCH EVENTS ERROR:",
        error
      );

      setError(error.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD EVENTS WHEN PAGE OPENS
  // ==========================================
  useEffect(() => {
    fetchEvents();
  }, []);

  // ==========================================
  // FILTER EVENTS
  // ==========================================
  const filteredEvents = useMemo(() => {
    const searchValue =
      searchTerm.toLowerCase().trim();

    return events.filter((event) => {
      const title = (
        event.title || ""
      ).toLowerCase();

      const venue = (
        event.venue || ""
      ).toLowerCase();

      const matchesSearch =
        title.includes(searchValue) ||
        venue.includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        event.frontendStatus ===
          statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    events,
    searchTerm,
    statusFilter,
  ]);

  // ==========================================
  // OPEN CREATE FORM
  // ==========================================
  const openCreateForm = () => {
    setEditingEvent(null);
    setFormData(initialForm);
    setShowForm(true);
  };

  // ==========================================
  // CLOSE FORM
  // ==========================================
  const closeForm = () => {
    setShowForm(false);
    setEditingEvent(null);
    setFormData(initialForm);
  };

  // ==========================================
  // HANDLE FORM CHANGE
  // ==========================================
  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // ==========================================
  // FRONTEND STATUS → BACKEND MODEL
  // ==========================================
  const getBackendStatus = (
    frontendStatus
  ) => {
    if (frontendStatus === "draft") {
      return {
        status: "Upcoming",
        publicationStatus: "Draft",
      };
    }

    if (frontendStatus === "closed") {
      return {
        status: "Completed",
        publicationStatus: "Published",
      };
    }

    return {
      status: "Upcoming",
      publicationStatus: "Published",
    };
  };

  // ==========================================
  // CREATE / UPDATE EVENT
  // ==========================================
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.category ||
      !formData.description.trim() ||
      !formData.venue.trim() ||
      !formData.eventDate ||
      !formData.startTime ||
      !formData.capacity
    ) {
      alert(
        "Please fill all required fields."
      );

      return;
    }

    try {
      setSaving(true);

      const token = getToken();

      if (!token) {
        throw new Error(
          "Login token not found. Please login again."
        );
      }

      const backendStatus =
        getBackendStatus(
          formData.status
        );

      const eventData = {
        title:
          formData.title.trim(),

        category:
          formData.category,

        description:
          formData.description.trim(),

        venue:
          formData.venue.trim(),

        date:
          formData.eventDate,

        time:
          formData.startTime,

        maxParticipants:
          Number(formData.capacity),

        status:
          backendStatus.status,

        publicationStatus:
          backendStatus.publicationStatus,
      };

      const url = editingEvent
        ? `${API_URL}/events/${editingEvent.id}`
        : `${API_URL}/events`;

      const method = editingEvent
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(
            eventData
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save event"
        );
      }

      closeForm();

      await fetchEvents();

      alert(
        editingEvent
          ? "Event updated successfully!"
          : "Event created and saved successfully!"
      );
    } catch (error) {
      console.error(
        "SAVE EVENT ERROR:",
        error
      );

      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // OPEN EDIT FORM
  // ==========================================
  const handleEdit = (eventItem) => {
    setEditingEvent(eventItem);

    let formattedDate = "";

    if (eventItem.eventDate) {
      const date = new Date(
        eventItem.eventDate
      );

      if (
        !Number.isNaN(date.getTime())
      ) {
        formattedDate = date
          .toISOString()
          .split("T")[0];
      }
    }

    setFormData({
      title:
        eventItem.title || "",

      category:
        eventItem.category || "",

      description:
        eventItem.description || "",

      venue:
        eventItem.venue || "",

      eventDate:
        formattedDate,

      startTime:
        eventItem.startTime || "",

      endTime:
        eventItem.endTime || "",

      registrationDeadline:
        eventItem.registrationDeadline ||
        "",

      capacity:
        eventItem.capacity || "",

      status:
        eventItem.frontendStatus ||
        "published",
    });

    setShowForm(true);
  };

  // ==========================================
  // DELETE EVENT
  // ==========================================
  const handleDelete = async (
    eventId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this event?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Login token not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/events/${eventId}`,
        {
          method: "DELETE",

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
            "Unable to delete event"
        );
      }

      await fetchEvents();

      alert(
        "Event deleted successfully!"
      );
    } catch (error) {
      console.error(
        "DELETE EVENT ERROR:",
        error
      );

      alert(error.message);
    }
  };

  // ==========================================
  // PUBLISH / CLOSE / REOPEN
  // ==========================================
  const changeStatus = async (
    eventId,
    newStatus
  ) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Login token not found. Please login again."
        );
      }

      const currentEvent =
        events.find(
          (item) =>
            item.id === eventId
        );

      if (!currentEvent) {
        throw new Error(
          "Event not found"
        );
      }

      const backendStatus =
        getBackendStatus(newStatus);

      const eventData = {
        title:
          currentEvent.title,

        category:
          currentEvent.category,

        description:
          currentEvent.description ||
          "No description provided.",

        venue:
          currentEvent.venue,

        date:
          currentEvent.eventDate,

        time:
          currentEvent.startTime,

        maxParticipants:
          Number(
            currentEvent.capacity
          ),

        status:
          backendStatus.status,

        publicationStatus:
          backendStatus.publicationStatus,
      };

      const response = await fetch(
        `${API_URL}/events/${eventId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(
            eventData
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update event status"
        );
      }

      await fetchEvents();
    } catch (error) {
      console.error(
        "CHANGE STATUS ERROR:",
        error
      );

      alert(error.message);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================
  const formatDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return "—";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(date.getTime())
    ) {
      return "—";
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
  // SUMMARY COUNTS
  // ==========================================
  const publishedCount =
    events.filter(
      (event) =>
        event.frontendStatus ===
        "published"
    ).length;

  const draftCount =
    events.filter(
      (event) =>
        event.frontendStatus ===
        "draft"
    ).length;

  const closedCount =
    events.filter(
      (event) =>
        event.frontendStatus ===
        "closed"
    ).length;

  return (
    <div className="coordinator-events-page">
      {/* PAGE HEADER */}

      <section className="events-page-header">
        <div>
          <p className="events-eyebrow">
            EVENT MANAGEMENT
          </p>

          <h1>Manage Events</h1>

          <p className="events-header-description">
            Create, publish and manage campus
            events from one place.
          </p>
        </div>

        <button
          className="create-event-button"
          onClick={openCreateForm}
        >
          <span>＋</span>
          Create Event
        </button>
      </section>

      {/* SUMMARY */}

      <section className="event-summary-grid">
        <article>
          <span>◫</span>

          <div>
            <p>Total Events</p>
            <h3>{events.length}</h3>
          </div>
        </article>

        <article>
          <span>✓</span>

          <div>
            <p>Published</p>
            <h3>{publishedCount}</h3>
          </div>
        </article>

        <article>
          <span>○</span>

          <div>
            <p>Drafts</p>
            <h3>{draftCount}</h3>
          </div>
        </article>

        <article>
          <span>⊘</span>

          <div>
            <p>Closed</p>
            <h3>{closedCount}</h3>
          </div>
        </article>
      </section>

      {/* FILTERS */}

      <section className="events-toolbar">
        <div className="event-search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search events or venues..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Status
          </option>

          <option value="published">
            Published
          </option>

          <option value="draft">
            Draft
          </option>

          <option value="closed">
            Closed
          </option>
        </select>
      </section>

      {/* EVENT LIST */}

      <section className="events-list-panel">
        <div className="events-list-heading">
          <div>
            <p>YOUR EVENTS</p>
            <h2>All Events</h2>
          </div>

          <span>
            {filteredEvents.length} event
            {filteredEvents.length !== 1
              ? "s"
              : ""}
          </span>
        </div>

        {loading && (
          <div className="events-empty-state">
            <div>◷</div>

            <h3>Loading events...</h3>

            <p>
              Getting events from the
              database.
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
              onClick={fetchEvents}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          filteredEvents.length === 0 && (
            <div className="events-empty-state">
              <div>◫</div>

              <h3>
                {events.length === 0
                  ? "No events created yet"
                  : "No matching events"}
              </h3>

              <p>
                {events.length === 0
                  ? "Create your first campus event and start accepting student registrations."
                  : "Try changing your search or filter."}
              </p>

              {events.length === 0 && (
                <button
                  onClick={openCreateForm}
                >
                  ＋ Create First Event
                </button>
              )}
            </div>
          )}

        {!loading &&
          !error &&
          filteredEvents.length > 0 && (
            <div className="event-cards-grid">
              {filteredEvents.map(
                (eventItem) => (
                  <article
                    className="coordinator-event-card"
                    key={eventItem.id}
                  >
                    <div className="event-card-top">
                      <span
                        className={`event-status ${eventItem.frontendStatus}`}
                      >
                        {eventItem.frontendStatus}
                      </span>

                      <span className="event-category">
                        {eventItem.category}
                      </span>
                    </div>

                    <h3>
                      {eventItem.title}
                    </h3>

                    <p className="event-description">
                      {eventItem.description ||
                        "No description provided."}
                    </p>

                    <div className="event-information">
                      <div>
                        <span>📅</span>

                        <p>
                          <small>Date</small>

                          <strong>
                            {formatDate(
                              eventItem.eventDate
                            )}
                          </strong>
                        </p>
                      </div>

                      <div>
                        <span>◷</span>

                        <p>
                          <small>Time</small>

                          <strong>
                            {eventItem.startTime ||
                              "—"}
                          </strong>
                        </p>
                      </div>

                      <div>
                        <span>⌖</span>

                        <p>
                          <small>Venue</small>

                          <strong>
                            {eventItem.venue}
                          </strong>
                        </p>
                      </div>

                      <div>
                        <span>◎</span>

                        <p>
                          <small>
                            Registrations
                          </small>

                          <strong>
                            {eventItem.registeredCount}/
                            {eventItem.capacity}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="event-capacity">
                      <div>
                        <span>Capacity</span>

                        <strong>
                          {eventItem.registeredCount}{" "}
                          of{" "}
                          {eventItem.capacity}
                        </strong>
                      </div>

                      <div className="event-capacity-bar">
                        <span
                          style={{
                            width: `${
                              eventItem.capacity
                                ? Math.min(
                                    (eventItem.registeredCount /
                                      eventItem.capacity) *
                                      100,
                                    100
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="event-card-actions">
                      <button
                        className="event-edit-button"
                        onClick={() =>
                          handleEdit(eventItem)
                        }
                      >
                        Edit
                      </button>

                      {eventItem.frontendStatus ===
                        "draft" && (
                        <button
                          className="event-publish-button"
                          onClick={() =>
                            changeStatus(
                              eventItem.id,
                              "published"
                            )
                          }
                        >
                          Publish
                        </button>
                      )}

                      {eventItem.frontendStatus ===
                        "published" && (
                        <button
                          className="event-close-button"
                          onClick={() =>
                            changeStatus(
                              eventItem.id,
                              "closed"
                            )
                          }
                        >
                          Close Registration
                        </button>
                      )}

                      {eventItem.frontendStatus ===
                        "closed" && (
                        <button
                          className="event-publish-button"
                          onClick={() =>
                            changeStatus(
                              eventItem.id,
                              "published"
                            )
                          }
                        >
                          Reopen
                        </button>
                      )}

                      <button
                        className="event-delete-button"
                        onClick={() =>
                          handleDelete(
                            eventItem.id
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
      </section>

      {/* CREATE / EDIT MODAL */}

      {showForm && (
        <div
          className="event-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <div className="event-modal">
            <div className="event-modal-header">
              <div>
                <p>
                  {editingEvent
                    ? "UPDATE EVENT"
                    : "NEW CAMPUS EVENT"}
                </p>

                <h2>
                  {editingEvent
                    ? "Edit Event"
                    : "Create Event"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
              >
                ×
              </button>
            </div>

            <form
              className="event-form"
              onSubmit={handleSubmit}
            >
              <div className="event-form-group full-width">
                <label>
                  Event Title *
                </label>

                <input
                  type="text"
                  name="title"
                  placeholder="Example: National Level Hackathon"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div className="event-form-group">
                <label>Category *</label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">
                    Select category
                  </option>
                  <option value="Technical">
                    Technical
                  </option>
                  <option value="Cultural">
                    Cultural
                  </option>
                  <option value="Sports">
                    Sports
                  </option>
                  <option value="Workshop">
                    Workshop
                  </option>
                  <option value="Seminar">
                    Seminar
                  </option>
                  <option value="Hackathon">
                    Hackathon
                  </option>
                  <option value="Symposium">
                    Symposium
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              <div className="event-form-group">
                <label>Capacity *</label>

                <input
                  type="number"
                  name="capacity"
                  min="1"
                  placeholder="Example: 100"
                  value={formData.capacity}
                  onChange={handleChange}
                />
              </div>

              <div className="event-form-group full-width">
                <label>Description *</label>

                <textarea
                  name="description"
                  rows="4"
                  placeholder="Tell students about the event..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="event-form-group full-width">
                <label>Venue *</label>

                <input
                  type="text"
                  name="venue"
                  placeholder="Example: Main Auditorium"
                  value={formData.venue}
                  onChange={handleChange}
                />
              </div>

              <div className="event-form-group">
                <label>Event Date *</label>

                <input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                />
              </div>

              <div className="event-form-group">
                <label>
                  Registration Deadline
                </label>

                <input
                  type="date"
                  name="registrationDeadline"
                  value={
                    formData.registrationDeadline
                  }
                  onChange={handleChange}
                />
              </div>

              <div className="event-form-group">
                <label>Start Time *</label>

                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                />
              </div>

              <div className="event-form-group">
                <label>End Time</label>

                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                />
              </div>

              <div className="event-form-group full-width">
                <label>Initial Status</label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="draft">
                    Save as Draft
                  </option>

                  <option value="published">
                    Publish Immediately
                  </option>
                </select>
              </div>

              <div className="event-form-actions">
                <button
                  type="button"
                  className="cancel-event-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-event-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingEvent
                      ? "Save Changes"
                      : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoordinatorEvents;