import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./CoordinatorAttendance.css";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


function CoordinatorAttendance() {
  const [events, setEvents] = useState([]);

  const [selectedEvent, setSelectedEvent] =
    useState("");

  const [students, setStudents] = useState([]);

  const [summary, setSummary] = useState({
    totalRegistered: 0,
    attendanceMarked: 0,
    present: 0,
    absent: 0,
    notMarked: 0,
  });

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [loadingEvents, setLoadingEvents] =
    useState(true);

  const [loadingAttendance, setLoadingAttendance] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState("");

  const [bulkLoading, setBulkLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  // ==========================================
  // GET TOKEN
  // ==========================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("authToken") ||
      ""
    );
  };


  // ==========================================
  // READ API RESPONSE
  // ==========================================

  const readResponse = async (response) => {
    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      await response.text();

      throw new Error(
        `Server returned an invalid response (${response.status}).`
      );
    }

    return response.json();
  };


  // ==========================================
  // FETCH EVENTS
  // ==========================================

  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      setError("");

      const response = await fetch(
        `${API_URL}/events`
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load events"
        );
      }

      const realEvents = data.events || [];

      setEvents(realEvents);

      setSelectedEvent((currentEvent) => {
        const stillExists = realEvents.some(
          (eventItem) =>
            eventItem._id === currentEvent
        );

        if (stillExists) {
          return currentEvent;
        }

        return realEvents[0]?._id || "";
      });
    } catch (err) {
      console.error("FETCH EVENTS ERROR:", err);

      setError(
        err.message || "Unable to load events"
      );

      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, []);


  // ==========================================
  // FETCH EVENT ATTENDANCE
  // ==========================================

  const fetchAttendance = useCallback(
    async (eventId) => {
      if (!eventId) {
        setStudents([]);

        setSummary({
          totalRegistered: 0,
          attendanceMarked: 0,
          present: 0,
          absent: 0,
          notMarked: 0,
        });

        return;
      }

      try {
        setLoadingAttendance(true);
        setError("");

        const token = getToken();

        const response = await fetch(
          `${API_URL}/attendance/event/${eventId}`,
          {
            method: "GET",

            headers: {
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
              "Failed to load attendance"
          );
        }

        setStudents(data.students || []);

        setSummary({
          totalRegistered:
            data.summary?.totalRegistered || 0,

          attendanceMarked:
            data.summary?.attendanceMarked || 0,

          present:
            data.summary?.present || 0,

          absent:
            data.summary?.absent || 0,

          notMarked:
            data.summary?.notMarked || 0,
        });
      } catch (err) {
        console.error(
          "FETCH ATTENDANCE ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to load attendance"
        );

        setStudents([]);
      } finally {
        setLoadingAttendance(false);
      }
    },
    []
  );


  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);


  // ==========================================
  // LOAD ATTENDANCE WHEN EVENT CHANGES
  // ==========================================

  useEffect(() => {
    if (selectedEvent) {
      fetchAttendance(selectedEvent);
    } else {
      setStudents([]);
    }
  }, [selectedEvent, fetchAttendance]);


  // ==========================================
  // EVENT OPTIONS
  // ==========================================

  const eventOptions = useMemo(() => {
    return events.map((eventItem) => ({
      id: eventItem._id,

      title:
        eventItem.title || "Untitled Event",

      date: eventItem.date,

      venue: eventItem.venue,

      status: eventItem.status,
    }));
  }, [events]);


  // ==========================================
  // SELECTED EVENT
  // ==========================================

  const selectedEventData = useMemo(() => {
    return eventOptions.find(
      (eventItem) =>
        eventItem.id === selectedEvent
    );
  }, [eventOptions, selectedEvent]);


  // ==========================================
  // FILTER STUDENTS
  // ==========================================

  const filteredStudents = useMemo(() => {
    const searchValue =
      searchTerm.trim().toLowerCase();

    return students.filter((item) => {
      const student = item.student || {};

      const studentName =
        student.fullName ||
        student.name ||
        "";

      const registerNumber =
        student.registerNumber ||
        student.registrationNumber ||
        student.regNo ||
        "";

      const department =
        student.department || "";

      const attendanceStatus =
        item.attendanceStatus ||
        item.status ||
        "Not Marked";

      const matchesSearch =
        !searchValue ||
        studentName
          .toLowerCase()
          .includes(searchValue) ||
        registerNumber
          .toLowerCase()
          .includes(searchValue) ||
        department
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        attendanceStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    students,
    searchTerm,
    statusFilter,
  ]);


  // ==========================================
  // MARK / UPDATE ONE STUDENT
  // ==========================================

  const markStudentAttendance = async (
    studentId,
    status
  ) => {
    if (!selectedEvent || !studentId) {
      return;
    }

    try {
      setActionLoading(studentId);
      setError("");
      setSuccessMessage("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/attendance/event/${selectedEvent}/student/${studentId}`,
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
            status,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update attendance"
        );
      }

      setSuccessMessage(
        `Attendance marked ${status} successfully.`
      );

      await fetchAttendance(selectedEvent);
    } catch (err) {
      console.error(
        "MARK ATTENDANCE ERROR:",
        err
      );

      setError(
        err.message ||
          "Failed to update attendance"
      );
    } finally {
      setActionLoading("");
    }
  };


  // ==========================================
  // RESET ONE STUDENT
  // ==========================================

  const resetStudentAttendance = async (
    studentId
  ) => {
    if (!selectedEvent || !studentId) {
      return;
    }

    try {
      setActionLoading(studentId);
      setError("");
      setSuccessMessage("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/attendance/event/${selectedEvent}/student/${studentId}`,
        {
          method: "DELETE",

          headers: {
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
            "Failed to reset attendance"
        );
      }

      setSuccessMessage(
        "Student attendance reset successfully."
      );

      await fetchAttendance(selectedEvent);
    } catch (err) {
      console.error(
        "RESET ATTENDANCE ERROR:",
        err
      );

      setError(
        err.message ||
          "Failed to reset attendance"
      );
    } finally {
      setActionLoading("");
    }
  };


  // ==========================================
  // MARK ALL PRESENT
  // ==========================================

  const markAllPresent = async () => {
    if (!selectedEvent) {
      return;
    }

    const confirmed = window.confirm(
      "Mark all registered students as Present?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setBulkLoading(true);
      setError("");
      setSuccessMessage("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/attendance/event/${selectedEvent}/mark-all-present`,
        {
          method: "POST",

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
            "Failed to mark all students present"
        );
      }

      setSuccessMessage(
        data.message ||
          "All students marked Present."
      );

      await fetchAttendance(selectedEvent);
    } catch (err) {
      console.error(
        "MARK ALL PRESENT ERROR:",
        err
      );

      setError(
        err.message ||
          "Failed to mark all students present"
      );
    } finally {
      setBulkLoading(false);
    }
  };


  // ==========================================
  // RESET ALL ATTENDANCE
  // ==========================================

  const resetAllAttendance = async () => {
    if (!selectedEvent) {
      return;
    }

    const confirmed = window.confirm(
      "Reset all attendance for this event?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setBulkLoading(true);
      setError("");
      setSuccessMessage("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/attendance/event/${selectedEvent}/reset-all`,
        {
          method: "DELETE",

          headers: {
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
            "Failed to reset all attendance"
        );
      }

      setSuccessMessage(
        "All attendance records reset successfully."
      );

      await fetchAttendance(selectedEvent);
    } catch (err) {
      console.error(
        "RESET ALL ERROR:",
        err
      );

      setError(
        err.message ||
          "Failed to reset all attendance"
      );
    } finally {
      setBulkLoading(false);
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
  // JSX
  // ==========================================

  return (
    <div className="coordinator-attendance-page">

      {/* HEADER */}

      <section className="attendance-page-header">

        <div>
          <p className="attendance-eyebrow">
            EVENT ATTENDANCE
          </p>

          <h1>
            Attendance Management
          </h1>

          <p>
            Mark and manage attendance for
            registered event participants.
          </p>
        </div>


        <button
          type="button"
          className="mark-all-present-button"
          onClick={markAllPresent}
          disabled={
            bulkLoading ||
            loadingAttendance ||
            !selectedEvent ||
            students.length === 0
          }
        >
          <span>✓</span>

          {bulkLoading
            ? "Processing..."
            : "Mark All Present"}
        </button>

      </section>


      {/* SUMMARY */}

      <section className="attendance-summary-grid">

        <article>
          <span>◎</span>

          <div>
            <p>Total Registered</p>

            <h3>
              {loadingAttendance
                ? "..."
                : summary.totalRegistered}
            </h3>
          </div>
        </article>


        <article>
          <span>✓</span>

          <div>
            <p>Present</p>

            <h3>
              {loadingAttendance
                ? "..."
                : summary.present}
            </h3>
          </div>
        </article>


        <article>
          <span>×</span>

          <div>
            <p>Absent</p>

            <h3>
              {loadingAttendance
                ? "..."
                : summary.absent}
            </h3>
          </div>
        </article>


        <article>
          <span>◷</span>

          <div>
            <p>Not Marked</p>

            <h3>
              {loadingAttendance
                ? "..."
                : summary.notMarked}
            </h3>
          </div>
        </article>

      </section>


      {/* EVENT SELECTOR */}

      <section className="attendance-event-selector">

        <div>
          <label>
            Select Event
          </label>

          <select
            value={selectedEvent}
            disabled={
              loadingEvents ||
              eventOptions.length === 0
            }
            onChange={(event) => {
              setSelectedEvent(
                event.target.value
              );

              setSearchTerm("");
              setStatusFilter("All");
              setSuccessMessage("");
            }}
          >

            {loadingEvents && (
              <option value="">
                Loading events...
              </option>
            )}


            {!loadingEvents &&
              eventOptions.length === 0 && (
                <option value="">
                  No events available
                </option>
              )}


            {eventOptions.map(
              (eventItem) => (
                <option
                  key={eventItem.id}
                  value={eventItem.id}
                >
                  {eventItem.title}
                </option>
              )
            )}

          </select>
        </div>


        <div className="selected-attendance-event">

          <span>◫</span>

          <div>
            <small>
              MARKING ATTENDANCE FOR
            </small>

            <strong>
              {selectedEventData?.title ||
                "Select an Event"}
            </strong>

            {selectedEventData && (
              <p>
                {formatDate(
                  selectedEventData.date
                )}

                {" · "}

                {selectedEventData.venue ||
                  "Venue not available"}
              </p>
            )}
          </div>

        </div>

      </section>


      {/* SUCCESS */}

      {successMessage && (
        <section className="attendance-message success">

          <span>✓</span>

          <div>
            <h3>Attendance updated</h3>

            <p>{successMessage}</p>
          </div>

        </section>
      )}


      {/* ERROR */}

      {error && (
        <section className="attendance-message error">

          <span>!</span>

          <div>
            <h3>
              Something went wrong
            </h3>

            <p>{error}</p>
          </div>

        </section>
      )}


      {/* TOOLBAR */}

      <section className="attendance-toolbar">

        <div className="attendance-search-box">

          <span>⌕</span>

          <input
            type="text"
            placeholder="Search student or register number..."
            value={searchTerm}
            disabled={loadingAttendance}
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
          <option value="All">
            All Status
          </option>

          <option value="Present">
            Present
          </option>

          <option value="Absent">
            Absent
          </option>

          <option value="Not Marked">
            Not Marked
          </option>
        </select>


        <button
          type="button"
          className="reset-all-attendance-button"
          onClick={resetAllAttendance}
          disabled={
            bulkLoading ||
            summary.attendanceMarked === 0
          }
        >
          Reset All
        </button>

      </section>


      {/* ATTENDANCE PANEL */}

      <section className="attendance-list-panel">

        <div className="attendance-list-heading">

          <div>
            <p>PARTICIPANTS</p>

            <h2>
              Registered Students
            </h2>
          </div>


          <span>
            {filteredStudents.length}{" "}
            student
            {filteredStudents.length !== 1
              ? "s"
              : ""}
          </span>

        </div>


        {/* LOADING */}

        {loadingAttendance && (
          <div className="attendance-empty-state">

            <div>◷</div>

            <h3>
              Loading attendance...
            </h3>

            <p>
              Getting registered students
              from MongoDB.
            </p>

          </div>
        )}


        {/* EMPTY */}

        {!loadingAttendance &&
          filteredStudents.length === 0 && (
            <div className="attendance-empty-state">

              <div>◎</div>

              <h3>
                {searchTerm ||
                statusFilter !== "All"
                  ? "No matching students"
                  : "No registered students"}
              </h3>

              <p>
                {searchTerm ||
                statusFilter !== "All"
                  ? "Try another search or attendance filter."
                  : "Students who register for this event will appear here."}
              </p>

            </div>
          )}


        {/* REAL STUDENTS */}

        {!loadingAttendance &&
          filteredStudents.length > 0 && (
            <div className="attendance-student-list">

              {filteredStudents.map(
                (item, index) => {
                  const student =
                    item.student || {};

                  const studentId =
                    student._id;

                  const studentName =
                    student.fullName ||
                    student.name ||
                    "Unknown Student";

                  const registerNumber =
                    student.registerNumber ||
                    student.registrationNumber ||
                    student.regNo ||
                    "—";

                  const attendanceStatus =
                    item.attendanceStatus ||
                    item.status ||
                    "Not Marked";

                  const isLoading =
                    actionLoading ===
                    studentId;

                  return (
                    <article
                      className="attendance-student-card"
                      key={
                        item.registrationId ||
                        studentId
                      }
                    >

                      <div className="attendance-student-number">
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </div>


                      <div className="attendance-student-profile">

                        <span>
                          {studentName
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        <div>
                          <strong>
                            {studentName}
                          </strong>

                          <small>
                            {registerNumber}
                          </small>

                          <small>
                            {student.email || "—"}
                          </small>
                        </div>

                      </div>


                      <div className="attendance-academic-info">

                        <span>
                          Department
                        </span>

                        <strong>
                          {student.department ||
                            "—"}
                        </strong>

                        <small>
                          Year{" "}
                          {student.year || "—"}

                          {" · "}

                          Section{" "}
                          {student.section || "—"}
                        </small>

                      </div>


                      <div className="attendance-seat-info">

                        <span>Seat</span>

                        <strong>
                          {item.seatNumber ||
                            "Not assigned"}
                        </strong>

                      </div>


                      <div className="attendance-current-status">

                        <span
                          className={`attendance-status-badge ${attendanceStatus
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {attendanceStatus}
                        </span>

                      </div>


                      <div className="attendance-actions">

                        <button
                          type="button"
                          className={`present-button ${
                            attendanceStatus ===
                            "Present"
                              ? "active"
                              : ""
                          }`}
                          disabled={
                            isLoading ||
                            bulkLoading
                          }
                          onClick={() =>
                            markStudentAttendance(
                              studentId,
                              "Present"
                            )
                          }
                        >
                          ✓ Present
                        </button>


                        <button
                          type="button"
                          className={`absent-button ${
                            attendanceStatus ===
                            "Absent"
                              ? "active"
                              : ""
                          }`}
                          disabled={
                            isLoading ||
                            bulkLoading
                          }
                          onClick={() =>
                            markStudentAttendance(
                              studentId,
                              "Absent"
                            )
                          }
                        >
                          × Absent
                        </button>


                        {attendanceStatus !==
                          "Not Marked" && (
                          <button
                            type="button"
                            className="reset-attendance-button"
                            disabled={
                              isLoading ||
                              bulkLoading
                            }
                            onClick={() =>
                              resetStudentAttendance(
                                studentId
                              )
                            }
                          >
                            {isLoading
                              ? "..."
                              : "↻"}
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


      {/* INFO */}

      <section className="attendance-info-card">

        <span>i</span>

        <div>
          <h3>
            Live attendance system
          </h3>

          <p>
            Present and Absent status is
            saved permanently in MongoDB.
            Admin and Coordinator share the
            same attendance records, and
            students can view their own
            attendance history.
          </p>
        </div>

      </section>

    </div>
  );
}


export default CoordinatorAttendance;