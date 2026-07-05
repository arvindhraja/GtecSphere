import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./AdminCoordinators.css";

const API_URL = "https://gtecsphere-backend.onrender.com/api";

const emptyForm = {
  fullName: "",
  email: "",
  department: "IT",
  phone: "",
  password: "",
};

function AdminCoordinators() {
  const [coordinators, setCoordinators] =
    useState([]);

  const [events, setEvents] = useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [eventsLoading, setEventsLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState("");

  const [savingAssignments, setSavingAssignments] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [formData, setFormData] =
    useState(emptyForm);

  const [
    showAssignmentModal,
    setShowAssignmentModal,
  ] = useState(false);

  const [
    selectedCoordinator,
    setSelectedCoordinator,
  ] = useState(null);

  const [
    selectedEventIds,
    setSelectedEventIds,
  ] = useState([]);


  // ==========================================
  // TOKEN
  // ==========================================

  const getToken = () => {
    return localStorage.getItem("token");
  };


  // ==========================================
  // AUTH HEADERS
  // ==========================================

  const getAuthHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",

      Authorization: `Bearer ${token}`,
    };
  };


  // ==========================================
  // SAFE JSON RESPONSE
  // ==========================================

  const readResponse = async (response) => {
    const contentType =
      response.headers.get("content-type");

    if (
      !contentType ||
      !contentType.includes("application/json")
    ) {
      const text = await response.text();

      console.error(
        "NON JSON RESPONSE:",
        text
      );

      throw new Error(
        `Server returned ${response.status}. Check backend route.`
      );
    }

    return response.json();
  };


  // ==========================================
  // NORMALIZE COORDINATOR
  // ==========================================

  const normalizeCoordinator = (
    coordinator
  ) => {
    return {
      ...coordinator,

      _id:
        coordinator._id ||
        coordinator.id,

      status:
        coordinator.isActive === false
          ? "inactive"
          : "active",

      assignedEvents:
        Array.isArray(
          coordinator.assignedEvents
        )
          ? coordinator.assignedEvents
          : [],
    };
  };


  // ==========================================
  // GET EVENT ID
  // SUPPORTS POPULATED OBJECT OR ID STRING
  // ==========================================

  const getEventId = (eventItem) => {
    if (!eventItem) {
      return "";
    }

    if (typeof eventItem === "string") {
      return eventItem;
    }

    return (
      eventItem._id ||
      eventItem.id ||
      ""
    ).toString();
  };


  // ==========================================
  // FETCH COORDINATORS
  // ==========================================

  const fetchCoordinators =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        if (!token) {
          throw new Error(
            "Login token not found. Please login again."
          );
        }

        const response = await fetch(
          `${API_URL}/admin/coordinators`,
          {
            method: "GET",

            credentials: "include",

            headers: getAuthHeaders(),
          }
        );

        const data =
  await readResponse(response);

console.log(
  "CREATE STATUS:",
  response.status
);

console.log(
  "CREATE RESPONSE:",
  data
);

if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load coordinators"
          );
        }

        const coordinatorList =
          data.coordinators ||
          data.users ||
          data.data ||
          [];

        setCoordinators(
          coordinatorList.map(
            normalizeCoordinator
          )
        );
      } catch (err) {
        console.error(
          "FETCH COORDINATORS ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to load coordinators"
        );
      } finally {
        setLoading(false);
      }
    }, []);


  // ==========================================
  // FETCH REAL EVENTS
  // ==========================================

  const fetchEvents =
    useCallback(async () => {
      try {
        setEventsLoading(true);

        const token = getToken();

        if (!token) {
          throw new Error(
            "Login token not found. Please login again."
          );
        }

        const response = await fetch(
          `${API_URL}/events`,
          {
            method: "GET",

            credentials: "include",

            headers: getAuthHeaders(),
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

        setEvents(
          data.events ||
          data.data ||
          []
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
      } finally {
        setEventsLoading(false);
      }
    }, []);


  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchCoordinators();
    fetchEvents();
  }, [
    fetchCoordinators,
    fetchEvents,
  ]);


  // ==========================================
  // CLEAR SUCCESS MESSAGE
  // ==========================================

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => {
      clearTimeout(timer);
    };
  }, [success]);


  // ==========================================
  // STATS
  // ==========================================

  const activeCount = useMemo(() => {
    return coordinators.filter(
      (coordinator) =>
        coordinator.isActive !== false
    ).length;
  }, [coordinators]);


  const inactiveCount = useMemo(() => {
    return coordinators.filter(
      (coordinator) =>
        coordinator.isActive === false
    ).length;
  }, [coordinators]);


  const assignedCount = useMemo(() => {
    return coordinators.filter(
      (coordinator) =>
        coordinator.assignedEvents?.length > 0
    ).length;
  }, [coordinators]);


  // ==========================================
  // FILTER COORDINATORS
  // ==========================================

  const filteredCoordinators =
    useMemo(() => {
      const searchValue =
        searchTerm
          .toLowerCase()
          .trim();

      return coordinators.filter(
        (coordinator) => {
          const fullName =
            coordinator.fullName
              ?.toLowerCase() || "";

          const email =
            coordinator.email
              ?.toLowerCase() || "";

          const department =
            coordinator.department
              ?.toLowerCase() || "";

          const matchesSearch =
            !searchValue ||
            fullName.includes(
              searchValue
            ) ||
            email.includes(
              searchValue
            ) ||
            department.includes(
              searchValue
            );

          const coordinatorStatus =
            coordinator.isActive === false
              ? "inactive"
              : "active";

          const matchesStatus =
            statusFilter === "all" ||
            coordinatorStatus ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      coordinators,
      searchTerm,
      statusFilter,
    ]);


  // ==========================================
  // FORM INPUT
  // ==========================================

  const handleInputChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previousData) => ({
        ...previousData,

        [name]: value,
      })
    );
  };


  // ==========================================
  // OPEN CREATE MODAL
  // ==========================================

  const openCreateForm = () => {
    setError("");
    setSuccess("");
    setFormData(emptyForm);
    setShowForm(true);
  };


  // ==========================================
  // CLOSE CREATE MODAL
  // ==========================================

  const closeForm = () => {
    if (creating) {
      return;
    }

    setShowForm(false);
    setFormData(emptyForm);
  };


  // ==========================================
  // CREATE COORDINATOR
  // ==========================================

  const createCoordinator =
    async (event) => {
      event.preventDefault();

      const fullName =
        formData.fullName.trim();

      const email =
        formData.email.trim();

      const password =
        formData.password.trim();

      const phone =
        formData.phone.trim();

      if (
        !fullName ||
        !email ||
        !password
      ) {
        setError(
          "Full name, email and password are required."
        );

        return;
      }

      if (password.length < 6) {
        setError(
          "Password must contain at least 6 characters."
        );

        return;
      }

      try {
        setCreating(true);
        setError("");
        setSuccess("");

        const response = await fetch(
          `${API_URL}/admin/coordinators`,
          {
            method: "POST",

            credentials: "include",

            headers: getAuthHeaders(),

            body: JSON.stringify({
              fullName,
              email,
              password,

              department:
                formData.department,

              phone,
            }),
          }
        );

        const data =
          await readResponse(response);

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to create coordinator"
          );
        }

        setSuccess(
          `${fullName} created successfully.`
        );

        setShowForm(false);

        setFormData(emptyForm);

        await fetchCoordinators();
      } catch (err) {
        console.error(
          "CREATE COORDINATOR ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to create coordinator"
        );
      } finally {
        setCreating(false);
      }
    };


  // ==========================================
  // ACTIVATE / DEACTIVATE
  // ==========================================

  const toggleCoordinatorStatus =
    async (coordinator) => {
      const currentlyActive =
        coordinator.isActive !== false;

      const action =
        currentlyActive
          ? "deactivate"
          : "activate";

      const confirmed =
        window.confirm(
          `Are you sure you want to ${action} ${
            coordinator.fullName ||
            "this coordinator"
          }?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setUpdatingId(
          coordinator._id
        );

        setError("");
        setSuccess("");

        const response = await fetch(
          `${API_URL}/admin/users/${coordinator._id}/status`,
          {
            method: "PATCH",

            credentials: "include",

            headers: getAuthHeaders(),
          }
        );

        const data =
          await readResponse(response);

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to update coordinator status"
          );
        }

        const updatedIsActive =
          typeof data.user?.isActive ===
          "boolean"
            ? data.user.isActive
            : !currentlyActive;

        setCoordinators(
          (currentCoordinators) =>
            currentCoordinators.map(
              (item) =>
                item._id ===
                coordinator._id
                  ? {
                      ...item,

                      isActive:
                        updatedIsActive,

                      status:
                        updatedIsActive
                          ? "active"
                          : "inactive",
                    }
                  : item
            )
        );

        setSuccess(
          `${coordinator.fullName} ${
            updatedIsActive
              ? "activated"
              : "deactivated"
          } successfully.`
        );
      } catch (err) {
        console.error(
          "UPDATE COORDINATOR STATUS ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to update coordinator status"
        );
      } finally {
        setUpdatingId("");
      }
    };


  // ==========================================
  // OPEN ASSIGNMENT MODAL
  // ==========================================

  const openAssignmentModal = (
    coordinator
  ) => {
    const alreadyAssignedIds =
      (
        coordinator.assignedEvents ||
        []
      )
        .map(getEventId)
        .filter(Boolean);

    setSelectedCoordinator(
      coordinator
    );

    setSelectedEventIds(
      alreadyAssignedIds
    );

    setError("");
    setSuccess("");

    setShowAssignmentModal(true);
  };


  // ==========================================
  // CLOSE ASSIGNMENT MODAL
  // ==========================================

  const closeAssignmentModal = () => {
    if (savingAssignments) {
      return;
    }

    setShowAssignmentModal(false);

    setSelectedCoordinator(null);

    setSelectedEventIds([]);
  };


  // ==========================================
  // CHECK IF EVENT IS SELECTED
  // ==========================================

  const isEventSelected = (
    eventId
  ) => {
    return selectedEventIds.includes(
      eventId.toString()
    );
  };


  // ==========================================
  // TOGGLE EVENT SELECTION
  // ==========================================

  const toggleEventSelection = (
    eventId
  ) => {
    const normalizedId =
      eventId.toString();

    setSelectedEventIds(
      (currentIds) => {
        if (
          currentIds.includes(
            normalizedId
          )
        ) {
          return currentIds.filter(
            (id) =>
              id !== normalizedId
          );
        }

        return [
          ...currentIds,
          normalizedId,
        ];
      }
    );
  };


  // ==========================================
  // SELECT ALL EVENTS
  // ==========================================

  const selectAllEvents = () => {
    const allEventIds = events
      .map((eventItem) =>
        getEventId(eventItem)
      )
      .filter(Boolean);

    setSelectedEventIds(
      allEventIds
    );
  };


  // ==========================================
  // CLEAR ALL EVENTS
  // ==========================================

  const clearAllEvents = () => {
    setSelectedEventIds([]);
  };


  // ==========================================
  // SAVE ASSIGNED EVENTS
  // ==========================================

  const saveAssignments = async () => {
    if (!selectedCoordinator?._id) {
      return;
    }

    try {
      setSavingAssignments(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/admin/coordinators/${selectedCoordinator._id}/events`,
        {
          method: "PATCH",

          credentials: "include",

          headers: getAuthHeaders(),

          body: JSON.stringify({
            eventIds:
              selectedEventIds,
          }),
        }
      );

      const data =
        await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save event assignments"
        );
      }

      const updatedCoordinator =
        normalizeCoordinator(
          data.coordinator
        );

      setCoordinators(
        (currentCoordinators) =>
          currentCoordinators.map(
            (coordinator) =>
              coordinator._id ===
              updatedCoordinator._id
                ? updatedCoordinator
                : coordinator
          )
      );

      setSuccess(
        selectedEventIds.length > 0
          ? `${selectedEventIds.length} event${
              selectedEventIds.length !== 1
                ? "s"
                : ""
            } assigned to ${selectedCoordinator.fullName}.`
          : `All event assignments cleared for ${selectedCoordinator.fullName}.`
      );

      setShowAssignmentModal(false);

      setSelectedCoordinator(null);

      setSelectedEventIds([]);
    } catch (err) {
      console.error(
        "SAVE EVENT ASSIGNMENTS ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to save event assignments"
      );
    } finally {
      setSavingAssignments(false);
    }
  };


  // ==========================================
  // HELPERS
  // ==========================================

  const getInitial = (name) => {
    return (
      name
        ?.trim()
        ?.charAt(0)
        ?.toUpperCase() ||
      "C"
    );
  };


  const formatDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return "Date not available";
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
    <div className="admin-coordinators-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <section className="coordinators-page-header">
        <div>
          <p className="coordinators-eyebrow">
            ADMIN ONLY
          </p>

          <h1>
            Coordinator Management
          </h1>

          <p>
            Create real coordinator accounts
            and manage campus event access.
          </p>
        </div>

        <button
          className="create-coordinator-button"
          onClick={openCreateForm}
        >
          <span>+</span>

          Add Coordinator
        </button>
      </section>


      {/* ======================================
          SUMMARY
      ====================================== */}

      <section className="coordinator-summary-grid">

        <article>
          <span>♟</span>

          <div>
            <p>
              Total Coordinators
            </p>

            <h3>
              {coordinators.length}
            </h3>
          </div>
        </article>


        <article>
          <span>✓</span>

          <div>
            <p>
              Active
            </p>

            <h3>
              {activeCount}
            </h3>
          </div>
        </article>


        <article>
          <span>○</span>

          <div>
            <p>
              Inactive
            </p>

            <h3>
              {inactiveCount}
            </h3>
          </div>
        </article>


        <article>
          <span>◫</span>

          <div>
            <p>
              Assigned to Events
            </p>

            <h3>
              {assignedCount}
            </h3>
          </div>
        </article>

      </section>


      {/* ======================================
          ADMIN INFO
      ====================================== */}

      <section className="coordinator-admin-info">
        <span>♛</span>

        <div>
          <h3>
            Admin-only control
          </h3>

          <p>
            Create coordinator accounts,
            activate or deactivate access,
            and assign real campus events.
          </p>
        </div>
      </section>


      {/* ======================================
          SUCCESS
      ====================================== */}

      {success && (
        <div className="coordinator-success-message">
          <span>✓</span>

          <div>
            <strong>
              Success
            </strong>

            <p>
              {success}
            </p>
          </div>
        </div>
      )}


      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div className="coordinator-error-message">
          <span>!</span>

          <div>
            <strong>
              Something went wrong
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button
            onClick={() => {
              setError("");
              fetchCoordinators();
            }}
          >
            Try Again
          </button>
        </div>
      )}


      {/* ======================================
          TOOLBAR
      ====================================== */}

      <section className="coordinator-management-toolbar">

        <div className="coordinator-search-box">
          <span>⌕</span>

          <input
            type="text"

            placeholder="Search name, email or department..."

            value={searchTerm}

            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
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

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>
        </select>

      </section>


      {/* ======================================
          COORDINATOR LIST
      ====================================== */}

      <section className="coordinator-list-panel">

        <div className="coordinator-panel-heading">
          <div>
            <p>
              TEAM MANAGEMENT
            </p>

            <h2>
              All Coordinators
            </h2>
          </div>

          <span>
            {filteredCoordinators.length}{" "}

            coordinator

            {filteredCoordinators.length !== 1
              ? "s"
              : ""}
          </span>
        </div>


        {loading ? (

          <div className="coordinator-empty-state">
            <div>↻</div>

            <h3>
              Loading coordinators...
            </h3>

            <p>
              Fetching live accounts from
              MongoDB.
            </p>
          </div>

        ) : filteredCoordinators.length === 0 ? (

          <div className="coordinator-empty-state">
            <div>♟</div>

            <h3>
              No coordinators found
            </h3>

            <p>
              Create a coordinator account
              or change your filters.
            </p>

            <button
              onClick={openCreateForm}
            >
              + Add Coordinator
            </button>
          </div>

        ) : (

          <div className="coordinator-management-list">

            {filteredCoordinators.map(
              (coordinator, index) => {
                const isActive =
                  coordinator.isActive !==
                  false;

                return (
                  <article
                    className="coordinator-management-card"

                    key={
                      coordinator._id
                    }
                  >

                    <div className="coordinator-number">
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </div>


                    <div className="coordinator-profile">
                      <span>
                        {getInitial(
                          coordinator.fullName
                        )}
                      </span>

                      <div>
                        <strong>
                          {coordinator.fullName ||
                            "Coordinator"}
                        </strong>

                        <small>
                          {coordinator.email}
                        </small>
                      </div>
                    </div>


                    <div className="coordinator-department">
                      <span>
                        Department
                      </span>

                      <strong>
                        {coordinator.department ||
                          "—"}
                      </strong>

                      <small>
                        {coordinator.phone ||
                          "No phone"}
                      </small>
                    </div>


                    <div className="coordinator-assignment-section">
                      <span>
                        Assigned Events
                      </span>

                      {coordinator
                        .assignedEvents
                        ?.length ? (

                        <small>
                          {
                            coordinator
                              .assignedEvents
                              .length
                          }{" "}

                          event

                          {coordinator
                            .assignedEvents
                            .length !== 1
                            ? "s"
                            : ""}
                        </small>

                      ) : (

                        <small className="no-event-assignment">
                          No events assigned
                        </small>
                      )}
                    </div>


                    <div className="coordinator-status-section">
                      <span
                        className={`coordinator-status-badge ${
                          isActive
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {isActive
                          ? "● Active"
                          : "○ Inactive"}
                      </span>
                    </div>


                    <div className="coordinator-card-actions">

                      <button
                        className="assign-events-button"

                        onClick={() =>
                          openAssignmentModal(
                            coordinator
                          )
                        }
                      >
                        Assign Events
                      </button>


                      <button
                        className={
                          isActive
                            ? "deactivate-coordinator-button"
                            : "activate-coordinator-button"
                        }

                        onClick={() =>
                          toggleCoordinatorStatus(
                            coordinator
                          )
                        }

                        disabled={
                          updatingId ===
                          coordinator._id
                        }
                      >
                        {updatingId ===
                        coordinator._id
                          ? "Saving..."
                          : isActive
                          ? "Deactivate"
                          : "Activate"}
                      </button>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>


      {/* ======================================
          CREATE MODAL
      ====================================== */}

      {showForm && (
        <div
          className="coordinator-modal-overlay"

          onMouseDown={closeForm}
        >
          <div
            className="coordinator-modal"

            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="coordinator-modal-header">
              <div>
                <p>
                  NEW ACCOUNT
                </p>

                <h2>
                  Create Coordinator
                </h2>
              </div>

              <button
                type="button"

                onClick={closeForm}

                disabled={creating}
              >
                ×
              </button>
            </div>


            <form
              className="coordinator-form"

              onSubmit={
                createCoordinator
              }
            >

              <div className="coordinator-form-grid">

                <label className="coordinator-full-field">
                  <span>
                    Full Name *
                  </span>

                  <input
                    type="text"

                    name="fullName"

                    value={
                      formData.fullName
                    }

                    onChange={
                      handleInputChange
                    }

                    placeholder="Coordinator full name"

                    required
                  />
                </label>


                <label>
                  <span>
                    Email Address *
                  </span>

                  <input
                    type="email"

                    name="email"

                    value={
                      formData.email
                    }

                    onChange={
                      handleInputChange
                    }

                    placeholder="coordinator@college.com"

                    required
                  />
                </label>


                <label>
                  <span>
                    Department
                  </span>

                  <select
                    name="department"

                    value={
                      formData.department
                    }

                    onChange={
                      handleInputChange
                    }
                  >
                    <option>IT</option>
                    <option>CSE</option>
                    <option>ECE</option>
                    <option>EEE</option>
                    <option>MECH</option>
                    <option>CIVIL</option>
                    <option>AI & DS</option>
                  </select>
                </label>


                <label>
                  <span>
                    Phone Number
                  </span>

                  <input
                    type="tel"

                    name="phone"

                    value={
                      formData.phone
                    }

                    onChange={
                      handleInputChange
                    }

                    placeholder="10-digit phone number"
                  />
                </label>


                <label>
                  <span>
                    Temporary Password *
                  </span>

                  <input
                    type="password"

                    name="password"

                    value={
                      formData.password
                    }

                    onChange={
                      handleInputChange
                    }

                    placeholder="Minimum 6 characters"

                    minLength="6"

                    required
                  />
                </label>

              </div>


              <div className="coordinator-form-actions">

                <button
                  type="button"

                  className="cancel-coordinator-button"

                  onClick={closeForm}

                  disabled={creating}
                >
                  Cancel
                </button>


                <button
                  type="submit"

                  className="save-coordinator-button"

                  disabled={creating}
                >
                  {creating
                    ? "Creating..."
                    : "Create Coordinator"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}


      {/* ======================================
          LIVE ASSIGNMENT MODAL
      ====================================== */}

      {showAssignmentModal &&
        selectedCoordinator && (

          <div
            className="coordinator-modal-overlay"

            onMouseDown={
              closeAssignmentModal
            }
          >

            <div
              className="assignment-modal"

              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              <div className="coordinator-modal-header">
                <div>
                  <p>
                    EVENT ACCESS
                  </p>

                  <h2>
                    Assign Events
                  </h2>
                </div>

                <button
                  type="button"

                  onClick={
                    closeAssignmentModal
                  }

                  disabled={
                    savingAssignments
                  }
                >
                  ×
                </button>
              </div>


              <div className="assignment-modal-content">

                <div className="assignment-coordinator-info">

                  <span>
                    {getInitial(
                      selectedCoordinator.fullName
                    )}
                  </span>

                  <div>
                    <strong>
                      {
                        selectedCoordinator.fullName
                      }
                    </strong>

                    <small>
                      {
                        selectedCoordinator.email
                      }
                    </small>
                  </div>

                </div>


                <p className="assignment-instruction">
                  Select the events this
                  coordinator can manage.
                  Changes are saved permanently
                  to MongoDB.
                </p>


                {/* SELECT / CLEAR */}

                {!eventsLoading &&
                  events.length > 0 && (

                    <div className="assignment-selection-tools">

                      <button
                        type="button"

                        onClick={
                          selectAllEvents
                        }

                        disabled={
                          savingAssignments
                        }
                      >
                        Select All
                      </button>


                      <button
                        type="button"

                        onClick={
                          clearAllEvents
                        }

                        disabled={
                          savingAssignments
                        }
                      >
                        Clear All
                      </button>

                    </div>
                  )}


                {/* EVENT LIST */}

                <div className="assignment-event-list">

                  {eventsLoading ? (

                    <div className="coordinator-empty-state">
                      <p>
                        Loading events...
                      </p>
                    </div>

                  ) : events.length === 0 ? (

                    <div className="coordinator-empty-state">
                      <p>
                        No events available.
                      </p>
                    </div>

                  ) : (

                    events.map(
                      (eventItem) => {
                        const eventId =
                          getEventId(
                            eventItem
                          );

                        const selected =
                          isEventSelected(
                            eventId
                          );

                        return (
                          <button
                            type="button"

                            key={
                              eventId
                            }

                            className={`assignment-event-card ${
                              selected
                                ? "selected"
                                : ""
                            }`}

                            onClick={() =>
                              toggleEventSelection(
                                eventId
                              )
                            }

                            disabled={
                              savingAssignments
                            }
                          >

                            <span className="assignment-checkbox">
                              {selected
                                ? "✓"
                                : "○"}
                            </span>


                            <div>
                              <strong>
                                {
                                  eventItem.title
                                }
                              </strong>

                              <small>
                                {formatDate(
                                  eventItem.date
                                )}{" "}

                                ·{" "}

                                {eventItem.status ||
                                  "Upcoming"}
                              </small>

                              {eventItem.venue && (
                                <small>
                                  {
                                    eventItem.venue
                                  }
                                </small>
                              )}
                            </div>

                          </button>
                        );
                      }
                    )
                  )}

                </div>


                {/* FOOTER */}

                <div className="assignment-modal-footer">

                  <span>
                    {selectedEventIds.length}{" "}

                    event

                    {selectedEventIds.length !== 1
                      ? "s"
                      : ""}{" "}

                    selected
                  </span>


                  <div className="assignment-footer-actions">

                    <button
                      type="button"

                      onClick={
                        closeAssignmentModal
                      }

                      disabled={
                        savingAssignments
                      }
                    >
                      Cancel
                    </button>


                    <button
                      type="button"

                      className="save-assignment-button"

                      onClick={
                        saveAssignments
                      }

                      disabled={
                        savingAssignments
                      }
                    >
                      {savingAssignments
                        ? "Saving..."
                        : "Save Assignments"}
                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>
        )}


      {/* ======================================
          LIVE BACKEND INFO
      ====================================== */}

      <section className="coordinator-backend-info">
        <span>✓</span>

        <div>
          <h3>
            Live backend connected
          </h3>

          <p>
            Coordinator accounts and event
            assignments are stored permanently
            in MongoDB.
          </p>
        </div>
      </section>

    </div>
  );
}

export default AdminCoordinators;