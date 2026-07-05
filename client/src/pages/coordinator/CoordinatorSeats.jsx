import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./CoordinatorSeats.css";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://gtecsphere-backend.onrender.com/api";


function CoordinatorSeats() {
  const [events, setEvents] = useState([]);

  const [students, setStudents] = useState([]);

  const [selectedEvent, setSelectedEvent] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [loadingEvents, setLoadingEvents] =
    useState(true);

  const [loadingStudents, setLoadingStudents] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [clearing, setClearing] =
    useState(false);

  const [error, setError] =
    useState("");

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
  // API RESPONSE HELPER
  // PREVENTS HTML JSON ERROR
  // ==========================================

  const readResponse = async (response) => {
    const contentType =
      response.headers.get("content-type") || "";

    if (
      !contentType.includes(
        "application/json"
      )
    ) {
      const text = await response.text();

      throw new Error(
        `Server returned an invalid response (${response.status}). Check the API URL and backend route.`
      );
    }

    return response.json();
  };


  // ==========================================
  // FETCH ALL REAL EVENTS
  // ==========================================

  const fetchEvents = useCallback(
    async () => {
      try {
        setLoadingEvents(true);
        setError("");

        const response = await fetch(
          `${API_URL}/events`,
          {
            method: "GET",
          }
        );

        const data =
          await readResponse(response);

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load events"
          );
        }

        const realEvents =
          data.events || [];

        setEvents(realEvents);

        setSelectedEvent(
          (currentEvent) => {
            const eventStillExists =
              realEvents.some(
                (eventItem) =>
                  eventItem._id ===
                  currentEvent
              );

            if (eventStillExists) {
              return currentEvent;
            }

            return (
              realEvents[0]?._id || ""
            );
          }
        );
      } catch (err) {
        console.error(
          "FETCH EVENTS ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to load events"
        );

        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    },
    []
  );


  // ==========================================
  // FETCH REGISTERED STUDENTS FOR EVENT
  // ==========================================

  const fetchEventStudents =
    useCallback(
      async (eventId) => {
        if (!eventId) {
          setStudents([]);
          return;
        }

        try {
          setLoadingStudents(true);
          setError("");
          setSuccessMessage("");

          const token = getToken();

          const response = await fetch(
            `${API_URL}/registrations/seats/${eventId}`,
            {
              method: "GET",

              headers: {
                ...(token && {
                  Authorization:
                    `Bearer ${token}`,
                }),
              },

              credentials: "include",
            }
          );

          const data =
            await readResponse(response);

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Failed to load registered students"
            );
          }

          const registrations =
            data.registrations || [];

          const formattedStudents =
            registrations.map(
              (registration) => {
                const student =
                  registration.student ||
                  {};

                const event =
                  registration.event ||
                  {};

                return {
                  id:
                    registration._id,

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
                    eventId,

                  eventTitle:
                    event.title ||
                    "Unknown Event",

                  seatNumber:
                    registration.seatNumber ||
                    "",

                  originalSeatNumber:
                    registration.seatNumber ||
                    "",

                  status:
                    registration.status ||
                    "Registered",
                };
              }
            );

          setStudents(
            formattedStudents
          );
        } catch (err) {
          console.error(
            "FETCH SEAT STUDENTS ERROR:",
            err
          );

          setError(
            err.message ||
              "Unable to load students"
          );

          setStudents([]);
        } finally {
          setLoadingStudents(false);
        }
      },
      []
    );


  // ==========================================
  // LOAD EVENTS
  // ==========================================

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);


  // ==========================================
  // LOAD STUDENTS WHEN EVENT CHANGES
  // ==========================================

  useEffect(() => {
    if (selectedEvent) {
      fetchEventStudents(
        selectedEvent
      );
    } else {
      setStudents([]);
    }
  }, [
    selectedEvent,
    fetchEventStudents,
  ]);


  // ==========================================
  // EVENT OPTIONS
  // ==========================================

  const eventOptions = useMemo(() => {
    return events.map(
      (eventItem) => ({
        id: eventItem._id,

        title:
          eventItem.title ||
          "Untitled Event",

        status:
          eventItem.status ||
          "Upcoming",
      })
    );
  }, [events]);


  // ==========================================
  // FILTER STUDENTS
  // ==========================================

  const filteredStudents =
    useMemo(() => {
      const searchValue =
        searchTerm
          .trim()
          .toLowerCase();

      if (!searchValue) {
        return students;
      }

      return students.filter(
        (student) =>
          student.studentName
            .toLowerCase()
            .includes(searchValue) ||

          student.registerNumber
            .toLowerCase()
            .includes(searchValue) ||

          student.department
            .toLowerCase()
            .includes(searchValue) ||

          student.email
            .toLowerCase()
            .includes(searchValue)
      );
    }, [students, searchTerm]);


  // ==========================================
  // ASSIGNED COUNT
  // ==========================================

  const assignedCount =
    students.filter(
      (student) =>
        student.seatNumber
          .trim() !== ""
    ).length;


  // ==========================================
  // UNASSIGNED COUNT
  // ==========================================

  const unassignedCount =
    students.length -
    assignedCount;


  // ==========================================
  // FIND DUPLICATE SEATS
  // ==========================================

  const duplicateSeats =
    useMemo(() => {
      const seatCounts = {};

      students.forEach(
        (student) => {
          const seat =
            student.seatNumber
              .trim()
              .toUpperCase();

          if (seat) {
            seatCounts[seat] =
              (seatCounts[seat] ||
                0) + 1;
          }
        }
      );

      return Object.keys(
        seatCounts
      ).filter(
        (seat) =>
          seatCounts[seat] > 1
      );
    }, [students]);


  // ==========================================
  // CHANGED ASSIGNMENTS
  // ==========================================

  const changedStudents =
    useMemo(() => {
      return students.filter(
        (student) =>
          student.seatNumber
            .trim()
            .toUpperCase() !==
          student.originalSeatNumber
            .trim()
            .toUpperCase()
      );
    }, [students]);


  // ==========================================
  // HANDLE SEAT INPUT
  // ==========================================

  const handleSeatChange = (
    studentId,
    value
  ) => {
    const cleanedValue =
      value
        .toUpperCase()
        .replace(/\s+/g, "");

    setStudents(
      (previousStudents) =>
        previousStudents.map(
          (student) =>
            student.id ===
            studentId
              ? {
                  ...student,

                  seatNumber:
                    cleanedValue,
                }
              : student
        )
    );

    setSuccessMessage("");
  };


  // ==========================================
  // CLEAR ONE SEAT LOCALLY
  // ==========================================

  const clearSeat = (
    studentId
  ) => {
    setStudents(
      (previousStudents) =>
        previousStudents.map(
          (student) =>
            student.id ===
            studentId
              ? {
                  ...student,

                  seatNumber: "",
                }
              : student
        )
    );

    setSuccessMessage("");
  };


  // ==========================================
  // AUTO ASSIGN SEATS LOCALLY
  // ==========================================

  const autoAssignSeats = () => {
    const usedSeats =
      new Set(
        students
          .map((student) =>
            student.seatNumber
              .trim()
              .toUpperCase()
          )
          .filter(Boolean)
      );

    let seatCounter = 1;

    setStudents(
      (previousStudents) =>
        previousStudents.map(
          (student) => {
            if (
              student.seatNumber
                .trim() !== ""
            ) {
              return student;
            }

            let generatedSeat = "";

            do {
              generatedSeat =
                `A${String(
                  seatCounter
                ).padStart(
                  2,
                  "0"
                )}`;

              seatCounter += 1;
            } while (
              usedSeats.has(
                generatedSeat
              )
            );

            usedSeats.add(
              generatedSeat
            );

            return {
              ...student,

              seatNumber:
                generatedSeat,
            };
          }
        )
    );

    setSuccessMessage("");
  };


  // ==========================================
  // SAVE ALL CHANGED ASSIGNMENTS
  // ==========================================

  const saveAssignments =
    async () => {
      if (!selectedEvent) {
        alert(
          "Please select an event first."
        );

        return;
      }

      if (
        duplicateSeats.length > 0
      ) {
        alert(
          `Duplicate seats found: ${duplicateSeats.join(
            ", "
          )}. Please fix them before saving.`
        );

        return;
      }

      const seatsToSave =
        changedStudents.filter(
          (student) =>
            student.seatNumber
              .trim() !== ""
        );

      const seatsClearedLocally =
        changedStudents.filter(
          (student) =>
            student.seatNumber
              .trim() === "" &&
            student.originalSeatNumber
              .trim() !== ""
        );

      if (
        seatsClearedLocally.length >
        0
      ) {
        alert(
          "To remove saved seats, use the Clear All button. Individual empty seats cannot be saved with the current backend route."
        );

        return;
      }

      if (
        seatsToSave.length === 0
      ) {
        alert(
          "No new seat changes to save."
        );

        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccessMessage("");

        const token = getToken();

        for (
          const student
          of seatsToSave
        ) {
          const response =
            await fetch(
              `${API_URL}/registrations/seats/${student.id}`,
              {
                method: "PUT",

                headers: {
                  "Content-Type":
                    "application/json",

                  ...(token && {
                    Authorization:
                      `Bearer ${token}`,
                  }),
                },

                credentials:
                  "include",

                body:
                  JSON.stringify({
                    seatNumber:
                      student.seatNumber
                        .trim()
                        .toUpperCase(),
                  }),
              }
            );

          const data =
            await readResponse(
              response
            );

          if (!response.ok) {
            throw new Error(
              data.message ||
                `Failed to save seat for ${student.studentName}`
            );
          }
        }

        setSuccessMessage(
          `${seatsToSave.length} seat assignment${
            seatsToSave.length !== 1
              ? "s"
              : ""
          } saved successfully.`
        );

        await fetchEventStudents(
          selectedEvent
        );
      } catch (err) {
        console.error(
          "SAVE SEATS ERROR:",
          err
        );

        setError(
          err.message ||
            "Failed to save seat assignments"
        );

        alert(
          err.message ||
            "Failed to save seat assignments"
        );
      } finally {
        setSaving(false);
      }
    };


  // ==========================================
  // CLEAR ALL SEATS FROM MONGODB
  // ==========================================

  const clearAllSeats =
    async () => {
      if (!selectedEvent) {
        return;
      }

      const confirmed =
        window.confirm(
          "Clear all saved seat assignments for this event?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setClearing(true);
        setError("");
        setSuccessMessage("");

        const token = getToken();

        const response =
          await fetch(
            `${API_URL}/registrations/seats/event/${selectedEvent}/clear`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                ...(token && {
                  Authorization:
                    `Bearer ${token}`,
                }),
              },

              credentials:
                "include",
            }
          );

        const data =
          await readResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to clear seats"
          );
        }

        setSuccessMessage(
          "All seat assignments cleared successfully."
        );

        await fetchEventStudents(
          selectedEvent
        );
      } catch (err) {
        console.error(
          "CLEAR ALL SEATS ERROR:",
          err
        );

        setError(
          err.message ||
            "Failed to clear seats"
        );

        alert(
          err.message ||
            "Failed to clear seats"
        );
      } finally {
        setClearing(false);
      }
    };


  // ==========================================
  // SELECTED EVENT NAME
  // ==========================================

  const selectedEventName =
    eventOptions.find(
      (eventItem) =>
        eventItem.id ===
        selectedEvent
    )?.title ||
    "Select an Event";


  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="coordinator-seats-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <section className="seats-page-header">

        <div>
          <p className="seats-eyebrow">
            EVENT SEATING
          </p>

          <h1>
            Seat Management
          </h1>

          <p>
            Assign and manage seats for
            registered students.
          </p>
        </div>


        <button
          type="button"
          className="save-seat-assignments"
          onClick={
            saveAssignments
          }
          disabled={
            saving ||
            loadingStudents ||
            !selectedEvent ||
            students.length === 0
          }
        >
          <span>
            {saving ? "◷" : "✓"}
          </span>

          {saving
            ? "Saving..."
            : "Save Assignments"}
        </button>

      </section>


      {/* =====================================
          SUMMARY
      ===================================== */}

      <section className="seat-summary-grid">

        <article>
          <span>◎</span>

          <div>
            <p>
              Total Students
            </p>

            <h3>
              {loadingStudents
                ? "..."
                : students.length}
            </h3>
          </div>
        </article>


        <article>
          <span>▦</span>

          <div>
            <p>
              Seats Assigned
            </p>

            <h3>
              {loadingStudents
                ? "..."
                : assignedCount}
            </h3>
          </div>
        </article>


        <article>
          <span>○</span>

          <div>
            <p>Unassigned</p>

            <h3>
              {loadingStudents
                ? "..."
                : unassignedCount}
            </h3>
          </div>
        </article>


        <article
          className={
            duplicateSeats.length > 0
              ? "duplicate-summary warning"
              : "duplicate-summary"
          }
        >
          <span>!</span>

          <div>
            <p>
              Duplicate Seats
            </p>

            <h3>
              {duplicateSeats.length}
            </h3>
          </div>
        </article>

      </section>


      {/* =====================================
          EVENT SELECTOR
      ===================================== */}

      <section className="seat-event-selector">

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
              setSuccessMessage("");
            }}
          >

            {loadingEvents && (
              <option value="">
                Loading events...
              </option>
            )}


            {!loadingEvents &&
              eventOptions.length ===
                0 && (
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


        <div className="selected-event-information">
          <span>◫</span>

          <div>
            <small>
              MANAGING SEATS FOR
            </small>

            <strong>
              {selectedEventName}
            </strong>
          </div>
        </div>

      </section>


      {/* =====================================
          SUCCESS MESSAGE
      ===================================== */}

      {successMessage && (
        <section className="seat-info-card">
          <span>✓</span>

          <div>
            <h3>
              Seats updated
            </h3>

            <p>
              {successMessage}
            </p>
          </div>
        </section>
      )}


      {/* =====================================
          ERROR MESSAGE
      ===================================== */}

      {error && (
        <section className="duplicate-seat-warning">
          <span>!</span>

          <div>
            <h3>
              Something went wrong
            </h3>

            <p>{error}</p>
          </div>
        </section>
      )}


      {/* =====================================
          TOOLBAR
      ===================================== */}

      <section className="seat-toolbar">

        <div className="seat-search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search student or register number..."
            value={searchTerm}
            disabled={
              loadingStudents
            }
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />
        </div>


        <div className="seat-toolbar-actions">

          <button
            type="button"
            className="auto-assign-button"
            onClick={
              autoAssignSeats
            }
            disabled={
              loadingStudents ||
              saving ||
              unassignedCount === 0
            }
          >
            <span>⚡</span>

            Auto Assign
          </button>


          <button
            type="button"
            className="clear-all-seats-button"
            onClick={
              clearAllSeats
            }
            disabled={
              loadingStudents ||
              saving ||
              clearing ||
              assignedCount === 0
            }
          >
            {clearing
              ? "Clearing..."
              : "Clear All"}
          </button>

        </div>

      </section>


      {/* =====================================
          DUPLICATE WARNING
      ===================================== */}

      {duplicateSeats.length > 0 && (
        <section className="duplicate-seat-warning">

          <span>!</span>

          <div>
            <h3>
              Duplicate seat numbers
              detected
            </h3>

            <p>
              Fix these seats before
              saving:{" "}

              <strong>
                {duplicateSeats.join(
                  ", "
                )}
              </strong>
            </p>
          </div>

        </section>
      )}


      {/* =====================================
          STUDENT LIST
      ===================================== */}

      <section className="seat-assignment-panel">

        <div className="seat-panel-heading">

          <div>
            <p>PARTICIPANTS</p>

            <h2>
              Assign Seats
            </h2>
          </div>


          <span>
            {filteredStudents.length}{" "}
            student
            {filteredStudents.length !==
            1
              ? "s"
              : ""}
          </span>

        </div>


        {/* LOADING */}

        {loadingStudents && (
          <div className="seat-empty-state">

            <div>◷</div>

            <h3>
              Loading registered
              students...
            </h3>

            <p>
              Getting participants from
              MongoDB.
            </p>

          </div>
        )}


        {/* NO EVENT */}

        {!loadingStudents &&
          !selectedEvent && (
            <div className="seat-empty-state">

              <div>◫</div>

              <h3>
                Select an event
              </h3>

              <p>
                Choose an event to manage
                participant seats.
              </p>

            </div>
          )}


        {/* EMPTY */}

        {!loadingStudents &&
          selectedEvent &&
          filteredStudents.length ===
            0 && (
            <div className="seat-empty-state">

              <div>▦</div>

              <h3>
                {searchTerm
                  ? "No matching students found"
                  : "No registered students"}
              </h3>

              <p>
                {searchTerm
                  ? "Try another student name or register number."
                  : "Students who register for this event will appear here automatically."}
              </p>

            </div>
          )}


        {/* REAL STUDENT LIST */}

        {!loadingStudents &&
          filteredStudents.length >
            0 && (
            <div className="seat-student-list">

              {filteredStudents.map(
                (
                  student,
                  index
                ) => {
                  const normalizedSeat =
                    student.seatNumber
                      .trim()
                      .toUpperCase();

                  const hasDuplicate =
                    normalizedSeat &&
                    duplicateSeats.includes(
                      normalizedSeat
                    );

                  const hasChanged =
                    student.seatNumber
                      .trim()
                      .toUpperCase() !==
                    student.originalSeatNumber
                      .trim()
                      .toUpperCase();

                  return (
                    <article
                      className={`seat-student-card ${
                        hasDuplicate
                          ? "has-duplicate"
                          : ""
                      }`}
                      key={student.id}
                    >

                      <div className="seat-student-number">
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </div>


                      <div className="seat-student-profile">

                        <span>
                          {student.studentName
                            .charAt(0)
                            .toUpperCase()}
                        </span>


                        <div>
                          <strong>
                            {student.studentName}
                          </strong>

                          <small>
                            {student.registerNumber}
                          </small>
                        </div>

                      </div>


                      <div className="seat-student-academic">

                        <span>
                          Department
                        </span>

                        <strong>
                          {student.department}
                        </strong>

                        <small>
                          Year{" "}
                          {student.year} ·
                          Section{" "}
                          {student.section}
                        </small>

                      </div>


                      <div className="seat-input-section">

                        <label>
                          Seat Number
                        </label>


                        <div>
                          <input
                            type="text"
                            placeholder="A01"
                            maxLength={10}
                            value={
                              student.seatNumber
                            }
                            disabled={
                              saving ||
                              clearing
                            }
                            onChange={(
                              event
                            ) =>
                              handleSeatChange(
                                student.id,
                                event.target.value
                              )
                            }
                          />


                          {student.seatNumber && (
                            <button
                              type="button"
                              disabled={
                                saving ||
                                clearing
                              }
                              onClick={() =>
                                clearSeat(
                                  student.id
                                )
                              }
                            >
                              ×
                            </button>
                          )}

                        </div>


                        {hasDuplicate && (
                          <small>
                            Duplicate seat
                            number
                          </small>
                        )}


                        {!hasDuplicate &&
                          hasChanged && (
                            <small>
                              Unsaved change
                            </small>
                          )}

                      </div>


                      <div className="seat-assignment-status">

                        {student.seatNumber ? (
                          <span className="seat-status-assigned">
                            {hasChanged
                              ? "◷ Unsaved"
                              : "✓ Assigned"}
                          </span>
                        ) : (
                          <span className="seat-status-pending">
                            ○ Pending
                          </span>
                        )}

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

      </section>


      {/* =====================================
          INFO
      ===================================== */}

      <section className="seat-info-card">

        <span>i</span>

        <div>
          <h3>
            How seat assignment works
          </h3>

          <p>
            Assign seats manually or use
            Auto Assign, then click Save
            Assignments. Seats are saved
            permanently in MongoDB and
            remain available after logout
            and login.
          </p>
        </div>

      </section>

    </div>
  );
}


export default CoordinatorSeats;