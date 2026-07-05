import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./CoordinatorRegistrations.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

function CoordinatorRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  // ==========================================
  // GET TOKEN
  // ==========================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("token") ||
      ""
    );
  };

  // ==========================================
  // SAFE RESPONSE READER
  // ==========================================

  const readResponse = async (response) => {
    const contentType =
      response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();

    throw new Error(
      text.includes("<!DOCTYPE")
        ? "Backend route not found. Check the API endpoint."
        : text || "Unexpected server response"
    );
  };

  // ==========================================
  // FETCH ALL REAL REGISTRATIONS
  // ==========================================

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/registrations/all`,
        {
          method: "GET",

          headers: {
            "Content-Type": "application/json",

            ...(token && {
              Authorization: `Bearer ${token}`,
            }),
          },

          credentials: "include",
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load registrations"
        );
      }

      setRegistrations(
        data.registrations || []
      );
    } catch (err) {
      console.error(
        "FETCH REGISTRATIONS ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to load registrations"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // LOAD WHEN PAGE OPENS
  // ==========================================

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // ==========================================
  // NORMALIZE REGISTRATION DATA
  // ==========================================

  const normalizedRegistrations = useMemo(() => {
    return registrations.map((registration) => {
      const student = registration.student || {};
      const event = registration.event || {};

      return {
        id:
          registration._id ||
          registration.id,

        studentName:
          student.fullName ||
          student.name ||
          "Unknown Student",

        registerNumber:
          student.registerNumber ||
          student.registrationNumber ||
          student.regNo ||
          "—",

        email:
          student.email ||
          "—",

        department:
          student.department ||
          "—",

        year:
          student.year ||
          "—",

        section:
          student.section ||
          "—",

        eventId:
          event._id ||
          event.id ||
          "",

        eventTitle:
          event.title ||
          "Unknown Event",

        registeredAt:
          registration.registeredAt ||
          registration.createdAt,

        seatNumber:
          registration.seatNumber ||
          "",

        status: (
          registration.status ||
          "Registered"
        ).toLowerCase(),

        original: registration,
      };
    });
  }, [registrations]);

  // ==========================================
  // EVENT OPTIONS
  // ==========================================

  const eventOptions = useMemo(() => {
    const eventMap = new Map();

    normalizedRegistrations.forEach(
      (registration) => {
        if (
          registration.eventId &&
          !eventMap.has(registration.eventId)
        ) {
          eventMap.set(
            registration.eventId,
            {
              id: registration.eventId,
              title: registration.eventTitle,
            }
          );
        }
      }
    );

    return Array.from(eventMap.values());
  }, [normalizedRegistrations]);

  // ==========================================
  // FILTER REGISTRATIONS
  // ==========================================

  const filteredRegistrations = useMemo(() => {
    const searchValue =
      searchTerm.trim().toLowerCase();

    return normalizedRegistrations.filter(
      (registration) => {
        const matchesSearch =
          !searchValue ||
          registration.studentName
            .toLowerCase()
            .includes(searchValue) ||
          registration.registerNumber
            .toLowerCase()
            .includes(searchValue) ||
          registration.email
            .toLowerCase()
            .includes(searchValue) ||
          registration.eventTitle
            .toLowerCase()
            .includes(searchValue);

        const matchesEvent =
          selectedEvent === "all" ||
          registration.eventId === selectedEvent;

        const matchesStatus =
          statusFilter === "all" ||
          registration.status === statusFilter;

        return (
          matchesSearch &&
          matchesEvent &&
          matchesStatus
        );
      }
    );
  }, [
    normalizedRegistrations,
    searchTerm,
    selectedEvent,
    statusFilter,
  ]);

  // ==========================================
  // UPDATE STATUS
  // ADMIN + COORDINATOR
  // ==========================================

  const updateStatus = async (
    registrationId,
    newStatus
  ) => {
    try {
      setActionLoading(registrationId);
      setError("");

      const token = getToken();

      const backendStatus =
        newStatus === "confirmed"
          ? "Registered"
          : newStatus === "cancelled"
          ? "Cancelled"
          : newStatus;

      const response = await fetch(
        `${API_URL}/registrations/${registrationId}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",

            ...(token && {
              Authorization: `Bearer ${token}`,
            }),
          },

          credentials: "include",

          body: JSON.stringify({
            status: backendStatus,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update registration"
        );
      }

      await fetchRegistrations();
    } catch (err) {
      console.error(
        "UPDATE STATUS ERROR:",
        err
      );

      alert(
        err.message ||
          "Failed to update registration"
      );
    } finally {
      setActionLoading("");
    }
  };

  // ==========================================
  // DELETE REGISTRATION
  // ADMIN ONLY
  // ==========================================

  const deleteRegistration = async (
    registrationId
  ) => {
    const confirmed = window.confirm(
      "Remove this student registration permanently?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(registrationId);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/registrations/admin/${registrationId}`,
        {
          method: "DELETE",

          headers: {
            "Content-Type": "application/json",

            ...(token && {
              Authorization: `Bearer ${token}`,
            }),
          },

          credentials: "include",
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete registration"
        );
      }

      await fetchRegistrations();
    } catch (err) {
      console.error(
        "DELETE REGISTRATION ERROR:",
        err
      );

      alert(
        err.message ||
          "Failed to delete registration"
      );
    } finally {
      setActionLoading("");
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
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
  // COUNTS
  // ==========================================

  const confirmedCount =
    normalizedRegistrations.filter(
      (registration) =>
        registration.status === "registered" ||
        registration.status === "confirmed"
    ).length;

  const pendingCount =
    normalizedRegistrations.filter(
      (registration) =>
        registration.status === "pending"
    ).length;

  const cancelledCount =
    normalizedRegistrations.filter(
      (registration) =>
        registration.status === "cancelled"
    ).length;

  // ==========================================
  // EXPORT CSV
  // ==========================================

  const exportRegistrations = () => {
    if (filteredRegistrations.length === 0) {
      alert(
        "No registrations available to export."
      );

      return;
    }

    const headers = [
      "Student Name",
      "Register Number",
      "Email",
      "Department",
      "Year",
      "Section",
      "Event",
      "Registered Date",
      "Seat Number",
      "Status",
    ];

    const rows =
      filteredRegistrations.map(
        (registration) => [
          registration.studentName,
          registration.registerNumber,
          registration.email,
          registration.department,
          registration.year,
          registration.section,
          registration.eventTitle,
          formatDate(registration.registeredAt),
          registration.seatNumber ||
            "Not assigned",
          registration.status,
        ]
      );

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.setAttribute(
      "download",
      `registrations-${Date.now()}.csv`
    );

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="coordinator-registrations-page">

      <section className="registrations-page-header">
        <div>
          <p className="registrations-eyebrow">
            STUDENT REGISTRATIONS
          </p>

          <h1>
            Registration Management
          </h1>

          <p>
            View and manage students registered
            for campus events.
          </p>
        </div>

        <button
          type="button"
          className="export-registrations-button"
          onClick={exportRegistrations}
        >
          <span>⇩</span>
          Export List
        </button>
      </section>

      <section className="registration-summary-grid">
        <article>
          <span>◎</span>

          <div>
            <p>Total Registrations</p>
            <h3>
              {normalizedRegistrations.length}
            </h3>
          </div>
        </article>

        <article>
          <span>✓</span>

          <div>
            <p>Confirmed</p>
            <h3>{confirmedCount}</h3>
          </div>
        </article>

        <article>
          <span>◷</span>

          <div>
            <p>Pending</p>
            <h3>{pendingCount}</h3>
          </div>
        </article>

        <article>
          <span>×</span>

          <div>
            <p>Cancelled</p>
            <h3>{cancelledCount}</h3>
          </div>
        </article>
      </section>

      <section className="registrations-toolbar">
        <div className="registration-search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search student, register number or email..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </div>

        <select
          value={selectedEvent}
          onChange={(event) =>
            setSelectedEvent(event.target.value)
          }
        >
          <option value="all">
            All Events
          </option>

          {eventOptions.map((eventItem) => (
            <option
              key={eventItem.id}
              value={eventItem.id}
            >
              {eventItem.title}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="all">
            All Status
          </option>

          <option value="registered">
            Confirmed
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="cancelled">
            Cancelled
          </option>
        </select>
      </section>

      <section className="registrations-list-panel">
        <div className="registrations-list-heading">
          <div>
            <p>EVENT PARTICIPANTS</p>
            <h2>Registered Students</h2>
          </div>

          <span>
            {filteredRegistrations.length}{" "}
            student
            {filteredRegistrations.length !== 1
              ? "s"
              : ""}
          </span>
        </div>

        {loading && (
          <div className="registrations-empty-state">
            <div>◷</div>

            <h3>
              Loading registrations...
            </h3>

            <p>
              Getting real student registrations
              from the database.
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="registrations-empty-state">
            <div>!</div>

            <h3>
              Unable to load registrations
            </h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={fetchRegistrations}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          filteredRegistrations.length === 0 && (
            <div className="registrations-empty-state">
              <div>◎</div>

              <h3>
                No registrations found
              </h3>

              <p>
                Real student registrations will
                appear here after students
                register for events.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          filteredRegistrations.length > 0 && (
            <div className="registrations-table-wrapper">
              <table className="registrations-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Event</th>
                    <th>Department</th>
                    <th>Registered</th>
                    <th>Seat</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRegistrations.map(
                    (registration) => (
                      <tr key={registration.id}>
                        <td>
                          <div className="registration-student">
                            <span>
                              {registration.studentName
                                .charAt(0)
                                .toUpperCase()}
                            </span>

                            <div>
                              <strong>
                                {registration.studentName}
                              </strong>

                              <small>
                                {registration.registerNumber}
                              </small>

                              <small>
                                {registration.email}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <strong className="registration-event-name">
                            {registration.eventTitle}
                          </strong>
                        </td>

                        <td>
                          <div className="registration-department">
                            <strong>
                              {registration.department}
                            </strong>

                            <small>
                              Year {registration.year} ·
                              Section {registration.section}
                            </small>
                          </div>
                        </td>

                        <td>
                          <span className="registration-date">
                            {formatDate(
                              registration.registeredAt
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              registration.seatNumber
                                ? "seat-assigned"
                                : "seat-not-assigned"
                            }
                          >
                            {registration.seatNumber ||
                              "Not assigned"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`registration-status ${
                              registration.status ===
                              "registered"
                                ? "confirmed"
                                : registration.status
                            }`}
                          >
                            {registration.status ===
                            "registered"
                              ? "confirmed"
                              : registration.status}
                          </span>
                        </td>

                        <td>
                          <div className="registration-actions">
                            {registration.status !==
                              "registered" &&
                              registration.status !==
                                "confirmed" && (
                                <button
                                  type="button"
                                  className="confirm-registration"
                                  disabled={
                                    actionLoading ===
                                    registration.id
                                  }
                                  onClick={() =>
                                    updateStatus(
                                      registration.id,
                                      "confirmed"
                                    )
                                  }
                                >
                                  Confirm
                                </button>
                              )}

                            {registration.status !==
                              "cancelled" && (
                              <button
                                type="button"
                                className="cancel-registration"
                                disabled={
                                  actionLoading ===
                                  registration.id
                                }
                                onClick={() =>
                                  updateStatus(
                                    registration.id,
                                    "cancelled"
                                  )
                                }
                              >
                                Cancel
                              </button>
                            )}

                            <button
                              type="button"
                              className="delete-registration"
                              disabled={
                                actionLoading ===
                                registration.id
                              }
                              onClick={() =>
                                deleteRegistration(
                                  registration.id
                                )
                              }
                            >
                              {actionLoading ===
                              registration.id
                                ? "..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
      </section>

      <section className="registration-info-card">
        <span>✓</span>

        <div>
          <h3>
            Live backend connected
          </h3>

          <p>
            Students who register for campus
            events will automatically appear
            here from MongoDB.
          </p>
        </div>
      </section>
    </div>
  );
}

export default CoordinatorRegistrations;