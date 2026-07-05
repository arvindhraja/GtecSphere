import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./CoordinatorCertificates.css";

const API_URL = "https://gtecsphere-backend.onrender.com/api";

function CoordinatorCertificates() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] =
    useState("");

  const [students, setStudents] = useState([]);

  const [eventSummary, setEventSummary] = useState({
    totalEligible: 0,
    issued: 0,
    revoked: 0,
    notIssued: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [loadingEvents, setLoadingEvents] =
    useState(true);

  const [loadingStudents, setLoadingStudents] =
    useState(false);

  const [pageError, setPageError] = useState("");

  const [actionLoading, setActionLoading] =
    useState("");

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // ==========================================
  // AUTH TOKEN
  // ==========================================
  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      ""
    );
  };

  // ==========================================
  // SAFE JSON RESPONSE
  // ==========================================
  const parseResponse = async (response) => {
    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await response.text();

      throw new Error(
        text
          ? `Server returned an invalid response`
          : `Server returned ${response.status}`
      );
    }

    return response.json();
  };

  // ==========================================
  // AUTH FETCH
  // ==========================================
  const authFetch = useCallback(
    async (url, options = {}) => {
      const token = getToken();

      const headers = {
        ...(options.headers || {}),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      if (
        options.body &&
        !(options.body instanceof FormData)
      ) {
        headers["Content-Type"] =
          "application/json";
      }

      return fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
    },
    []
  );

  // ==========================================
  // SHOW MESSAGE
  // ==========================================
  const showMessage = (type, text) => {
    setMessage({
      type,
      text,
    });

    window.setTimeout(() => {
      setMessage({
        type: "",
        text: "",
      });
    }, 3500);
  };

  // ==========================================
  // LOAD EVENTS
  // ==========================================
  const loadEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      setPageError("");

      const response = await authFetch(
        `${API_URL}/events`
      );

      const data = await parseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load events"
        );
      }

      const eventList = Array.isArray(data.events)
        ? data.events
        : [];

      setEvents(eventList);

      setSelectedEventId((currentId) => {
        if (
          currentId &&
          eventList.some(
            (event) => event._id === currentId
          )
        ) {
          return currentId;
        }

        return eventList[0]?._id || "";
      });
    } catch (error) {
      console.error(
        "LOAD CERTIFICATE EVENTS ERROR:",
        error
      );

      setPageError(error.message);
      setEvents([]);
      setSelectedEventId("");
    } finally {
      setLoadingEvents(false);
    }
  }, [authFetch]);

  // ==========================================
  // LOAD ELIGIBLE STUDENTS
  // ==========================================
  const loadEligibleStudents =
    useCallback(async () => {
      if (!selectedEventId) {
        setStudents([]);

        setEventSummary({
          totalEligible: 0,
          issued: 0,
          revoked: 0,
          notIssued: 0,
        });

        return;
      }

      try {
        setLoadingStudents(true);
        setPageError("");

        const response = await authFetch(
          `${API_URL}/certificates/event/${selectedEventId}/eligible`
        );

        const data = await parseResponse(response);

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to load eligible students"
          );
        }

        setStudents(
          Array.isArray(data.students)
            ? data.students
            : []
        );

        setEventSummary({
          totalEligible:
            data.summary?.totalEligible || 0,

          issued:
            data.summary?.issued || 0,

          revoked:
            data.summary?.revoked || 0,

          notIssued:
            data.summary?.notIssued || 0,
        });
      } catch (error) {
        console.error(
          "LOAD ELIGIBLE STUDENTS ERROR:",
          error
        );

        setPageError(error.message);

        setStudents([]);

        setEventSummary({
          totalEligible: 0,
          issued: 0,
          revoked: 0,
          notIssued: 0,
        });
      } finally {
        setLoadingStudents(false);
      }
    }, [authFetch, selectedEventId]);

  // ==========================================
  // INITIAL LOAD
  // ==========================================
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // ==========================================
  // EVENT CHANGE LOAD
  // ==========================================
  useEffect(() => {
    loadEligibleStudents();
  }, [loadEligibleStudents]);

  // ==========================================
  // SELECTED EVENT
  // ==========================================
  const selectedEvent = useMemo(() => {
    return events.find(
      (event) => event._id === selectedEventId
    );
  }, [events, selectedEventId]);

  // ==========================================
  // FILTER STUDENTS
  // ==========================================
  const filteredStudents = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return students.filter((item) => {
      const student = item.student || {};

      const searchableText = [
        student.fullName,
        student.registerNumber,
        student.email,
        student.department,
        student.year,
        student.section,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search ||
        searchableText.includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        item.certificateStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter]);

  // ==========================================
  // ISSUE ONE CERTIFICATE
  // ==========================================
  const handleIssueCertificate = async (
    studentId
  ) => {
    if (!selectedEventId || !studentId) {
      return;
    }

    try {
      setActionLoading(`issue-${studentId}`);

      const response = await authFetch(
        `${API_URL}/certificates/issue`,
        {
          method: "POST",

          body: JSON.stringify({
            eventId: selectedEventId,
            studentId,
          }),
        }
      );

      const data = await parseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to issue certificate"
        );
      }

      showMessage(
        "success",
        data.message ||
          "Certificate issued successfully"
      );

      await loadEligibleStudents();
    } catch (error) {
      console.error(
        "ISSUE CERTIFICATE ERROR:",
        error
      );

      showMessage("error", error.message);
    } finally {
      setActionLoading("");
    }
  };

  // ==========================================
  // ISSUE ALL CERTIFICATES
  // ==========================================
  const handleIssueAll = async () => {
    if (!selectedEventId) {
      return;
    }

    if (eventSummary.notIssued === 0) {
      showMessage(
        "error",
        "No students are waiting for certificates"
      );

      return;
    }

    const confirmed = window.confirm(
      `Issue certificates to all ${eventSummary.notIssued} eligible student(s)?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading("issue-all");

      const response = await authFetch(
        `${API_URL}/certificates/event/${selectedEventId}/issue-all`,
        {
          method: "POST",
        }
      );

      const data = await parseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to issue certificates"
        );
      }

      showMessage(
        "success",
        data.message ||
          "Certificates issued successfully"
      );

      await loadEligibleStudents();
    } catch (error) {
      console.error(
        "ISSUE ALL CERTIFICATES ERROR:",
        error
      );

      showMessage("error", error.message);
    } finally {
      setActionLoading("");
    }
  };

  // ==========================================
  // REVOKE CERTIFICATE
  // ==========================================
  const handleRevokeCertificate = async (
    certificateId,
    studentName
  ) => {
    if (!certificateId) {
      return;
    }

    const confirmed = window.confirm(
      `Revoke the certificate issued to ${
        studentName || "this student"
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(
        `revoke-${certificateId}`
      );

      const response = await authFetch(
        `${API_URL}/certificates/${certificateId}/revoke`,
        {
          method: "PATCH",
        }
      );

      const data = await parseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to revoke certificate"
        );
      }

      showMessage(
        "success",
        data.message ||
          "Certificate revoked successfully"
      );

      await loadEligibleStudents();
    } catch (error) {
      console.error(
        "REVOKE CERTIFICATE ERROR:",
        error
      );

      showMessage("error", error.message);
    } finally {
      setActionLoading("");
    }
  };

  // ==========================================
  // COPY CERTIFICATE NUMBER
  // ==========================================
  const handleCopyNumber = async (
    certificateNumber
  ) => {
    if (!certificateNumber) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        certificateNumber
      );

      showMessage(
        "success",
        "Certificate number copied"
      );
    } catch {
      showMessage(
        "error",
        "Unable to copy certificate number"
      );
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================
  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // STUDENT INITIAL
  // ==========================================
  const getInitial = (name) => {
    return name?.trim()?.charAt(0)?.toUpperCase() ||
      "S";
  };

  return (
    <div className="coordinator-certificates-page">
      {/* ======================================
          PAGE HEADER
      ====================================== */}
      <section className="certificates-page-header">
        <div>
          <p className="certificates-eyebrow">
            ACHIEVEMENT RECOGNITION
          </p>

          <h1>Certificate Management</h1>

          <p className="certificates-subtitle">
            Issue and manage certificates for
            students marked present.
          </p>
        </div>

        <button
          type="button"
          className="certificate-issue-all-button"
          onClick={handleIssueAll}
          disabled={
            !selectedEventId ||
            eventSummary.notIssued === 0 ||
            actionLoading === "issue-all"
          }
        >
          {actionLoading === "issue-all"
            ? "Issuing..."
            : "✓ Issue All Eligible"}
        </button>
      </section>

      {/* ======================================
          MESSAGE
      ====================================== */}
      {message.text && (
        <div
          className={`certificate-message ${message.type}`}
        >
          <span>
            {message.type === "success"
              ? "✓"
              : "!"}
          </span>

          <p>{message.text}</p>
        </div>
      )}

      {/* ======================================
          STATS
      ====================================== */}
      <section className="certificate-stats-grid">
        <article className="certificate-stat-card">
          <div className="certificate-stat-icon">
            ◎
          </div>

          <div>
            <span>Total Eligible</span>
            <strong>
              {eventSummary.totalEligible}
            </strong>
          </div>
        </article>

        <article className="certificate-stat-card">
          <div className="certificate-stat-icon">
            ✓
          </div>

          <div>
            <span>Issued</span>
            <strong>
              {eventSummary.issued}
            </strong>
          </div>
        </article>

        <article className="certificate-stat-card">
          <div className="certificate-stat-icon">
            ○
          </div>

          <div>
            <span>Not Issued</span>
            <strong>
              {eventSummary.notIssued}
            </strong>
          </div>
        </article>

        <article className="certificate-stat-card">
          <div className="certificate-stat-icon">
            ×
          </div>

          <div>
            <span>Revoked</span>
            <strong>
              {eventSummary.revoked}
            </strong>
          </div>
        </article>
      </section>

      {/* ======================================
          EVENT SELECTOR
      ====================================== */}
      <section className="certificate-event-panel">
        <div className="certificate-event-select">
          <label htmlFor="certificate-event">
            Select Event
          </label>

          <select
            id="certificate-event"
            value={selectedEventId}
            onChange={(event) => {
              setSelectedEventId(
                event.target.value
              );

              setSearchTerm("");
              setStatusFilter("All");
            }}
            disabled={loadingEvents}
          >
            {events.length === 0 && (
              <option value="">
                {loadingEvents
                  ? "Loading events..."
                  : "No events available"}
              </option>
            )}

            {events.map((event) => (
              <option
                key={event._id}
                value={event._id}
              >
                {event.title}
              </option>
            ))}
          </select>
        </div>

        <div className="certificate-managing-event">
          <div className="certificate-event-icon">
            ◇
          </div>

          <div>
            <span>
              MANAGING CERTIFICATES FOR
            </span>

            <strong>
              {selectedEvent?.title ||
                "Select an event"}
            </strong>

            {selectedEvent && (
              <small>
                {formatDate(selectedEvent.date)}
                {" • "}
                {selectedEvent.venue || "No venue"}
              </small>
            )}
          </div>
        </div>
      </section>

      {/* ======================================
          SEARCH + FILTER
      ====================================== */}
      <section className="certificate-controls">
        <div className="certificate-search">
          <span>⌕</span>

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search student, register number or department..."
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
            >
              ×
            </button>
          )}
        </div>

        <select
          className="certificate-status-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="All">
            All Status
          </option>

          <option value="Not Issued">
            Not Issued
          </option>

          <option value="Issued">
            Issued
          </option>

          <option value="Revoked">
            Revoked
          </option>
        </select>

        <button
          type="button"
          className="certificate-refresh-button"
          onClick={loadEligibleStudents}
          disabled={
            loadingStudents ||
            !selectedEventId
          }
        >
          {loadingStudents
            ? "Loading..."
            : "↻ Refresh"}
        </button>
      </section>

      {/* ======================================
          STUDENT LIST
      ====================================== */}
      <section className="certificate-list-panel">
        <div className="certificate-list-heading">
          <div>
            <p>ELIGIBLE PARTICIPANTS</p>
            <h2>Present Students</h2>
          </div>

          <span>
            {filteredStudents.length}{" "}
            {filteredStudents.length === 1
              ? "student"
              : "students"}
          </span>
        </div>

        {/* ==================================
            LOADING
        ================================== */}
        {loadingStudents ? (
          <div className="certificate-empty-state">
            <div className="certificate-loader">
              ↻
            </div>

            <h3>Loading students...</h3>

            <p>
              Checking attendance and certificate
              records.
            </p>
          </div>
        ) : pageError ? (
          /* ==================================
              ERROR
          ================================== */
          <div className="certificate-empty-state">
            <div>!</div>

            <h3>
              Unable to load certificates
            </h3>

            <p>{pageError}</p>

            <button
              type="button"
              onClick={() => {
                loadEvents();
                loadEligibleStudents();
              }}
            >
              Try Again
            </button>
          </div>
        ) : !selectedEventId ? (
          /* ==================================
              NO EVENT
          ================================== */
          <div className="certificate-empty-state">
            <div>◇</div>

            <h3>No event selected</h3>

            <p>
              Create or select an event to manage
              certificates.
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          /* ==================================
              EMPTY
          ================================== */
          <div className="certificate-empty-state">
            <div>◎</div>

            <h3>
              {students.length === 0
                ? "No eligible students yet"
                : "No students found"}
            </h3>

            <p>
              {students.length === 0
                ? "Students marked Present in Attendance will automatically appear here."
                : "Try another search or certificate status."}
            </p>

            {students.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("All");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* ==================================
              LIVE STUDENTS
          ================================== */
          <div className="certificate-students-list">
            {filteredStudents.map(
              (item, index) => {
                const student =
                  item.student || {};

                const isIssuing =
                  actionLoading ===
                  `issue-${student._id}`;

                const isRevoking =
                  actionLoading ===
                  `revoke-${item.certificateId}`;

                return (
                  <article
                    className="certificate-student-card"
                    key={
                      item.attendanceId ||
                      student._id ||
                      index
                    }
                  >
                    <div className="certificate-row-number">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </div>

                    <div className="certificate-student-info">
                      <div className="certificate-avatar">
                        {getInitial(
                          student.fullName
                        )}
                      </div>

                      <div>
                        <strong>
                          {student.fullName ||
                            "Student"}
                        </strong>

                        <span>
                          {student.registerNumber ||
                            "No register number"}
                        </span>

                        <small>
                          {student.email || ""}
                        </small>
                      </div>
                    </div>

                    <div className="certificate-student-detail">
                      <span>Department</span>

                      <strong>
                        {student.department || "—"}
                      </strong>

                      <small>
                        {student.year || "—"}
                        {student.section
                          ? ` • Section ${student.section}`
                          : ""}
                      </small>
                    </div>

                    <div className="certificate-student-detail">
                      <span>Attendance</span>

                      <strong className="certificate-present-text">
                        ✓ Present
                      </strong>

                      <small>
                        {formatDate(item.markedAt)}
                      </small>
                    </div>

                    <div className="certificate-number-area">
                      <span>
                        Certificate Number
                      </span>

                      {item.certificateNumber ? (
                        <button
                          type="button"
                          className="certificate-number-button"
                          onClick={() =>
                            handleCopyNumber(
                              item.certificateNumber
                            )
                          }
                          title="Copy certificate number"
                        >
                          {
                            item.certificateNumber
                          }
                        </button>
                      ) : (
                        <strong>Not generated</strong>
                      )}
                    </div>

                    <div className="certificate-status-area">
                      <span
                        className={`certificate-status-badge ${
                          item.certificateStatus ===
                          "Issued"
                            ? "issued"
                            : item.certificateStatus ===
                              "Revoked"
                            ? "revoked"
                            : "not-issued"
                        }`}
                      >
                        {item.certificateStatus}
                      </span>
                    </div>

                    <div className="certificate-actions">
                      {item.certificateStatus ===
                        "Not Issued" && (
                        <button
                          type="button"
                          className="certificate-issue-button"
                          disabled={
                            isIssuing ||
                            Boolean(actionLoading)
                          }
                          onClick={() =>
                            handleIssueCertificate(
                              student._id
                            )
                          }
                        >
                          {isIssuing
                            ? "Issuing..."
                            : "Issue Certificate"}
                        </button>
                      )}

                      {item.certificateStatus ===
                        "Issued" && (
                        <button
                          type="button"
                          className="certificate-revoke-button"
                          disabled={
                            isRevoking ||
                            Boolean(actionLoading)
                          }
                          onClick={() =>
                            handleRevokeCertificate(
                              item.certificateId,
                              student.fullName
                            )
                          }
                        >
                          {isRevoking
                            ? "Revoking..."
                            : "Revoke"}
                        </button>
                      )}

                      {item.certificateStatus ===
                        "Revoked" && (
                        <button
                          type="button"
                          className="certificate-disabled-button"
                          disabled
                        >
                          Revoked
                        </button>
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      {/* ======================================
          INFO BOX
      ====================================== */}
      <section className="certificate-info-box">
        <div>i</div>

        <div>
          <strong>
            How certificate issuing works
          </strong>

          <p>
            Only students marked Present are
            eligible. Issue one certificate or use
            Issue All Eligible. Certificates are
            saved permanently in MongoDB and appear
            automatically in the student portal.
          </p>
        </div>
      </section>
    </div>
  );
}

export default CoordinatorCertificates;