import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./AdminStudents.css";

const API_URL = "https://gtecsphere-backend.onrender.com/api";


function AdminStudents() {
  const [students, setStudents] = useState([]);

  const [search, setSearch] = useState("");
  const [department, setDepartment] =
    useState("All");
  const [year, setYear] = useState("All");
  const [status, setStatus] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [
    selectedStudent,
    setSelectedStudent,
  ] = useState(null);

  const [
    studentActivity,
    setStudentActivity,
  ] = useState(null);

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(false);

  const [updatingId, setUpdatingId] =
    useState("");


  // ==========================================
  // GET TOKEN
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
  // FETCH ALL STUDENTS
  // ==========================================

  const fetchStudents = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("token");

        if (!token) {
          throw new Error(
            "Login token not found. Please login again."
          );
        }

        const response = await fetch(
          `${API_URL}/admin/students`,
          {
            method: "GET",

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );


        const contentType =
          response.headers.get(
            "content-type"
          );


        if (
          !contentType ||
          !contentType.includes(
            "application/json"
          )
        ) {
          const text =
            await response.text();

          console.error(
            "NON JSON RESPONSE:",
            text
          );

          throw new Error(
            `Server returned ${response.status}. Check the backend route.`
          );
        }


        const data =
          await response.json();


        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load students"
          );
        }


        setStudents(
          data.students ||
          data.users ||
          []
        );

      } catch (err) {
        console.error(
          "FETCH STUDENTS ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to load students"
        );

      } finally {
        setLoading(false);
      }
    },
    []
  );


  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);


  // ==========================================
  // FILTERED STUDENTS
  // ==========================================

  const filteredStudents =
    useMemo(() => {
      const searchValue = search
        .trim()
        .toLowerCase();


      return students.filter(
        (student) => {
          const fullName =
            student.fullName
              ?.toLowerCase() || "";

          const email =
            student.email
              ?.toLowerCase() || "";

          const registerNumber =
            student.registerNumber
              ?.toLowerCase() || "";

          const studentDepartment =
            student.department || "";

          const studentYear =
            student.year || "";


          const matchesSearch =
            !searchValue ||
            fullName.includes(
              searchValue
            ) ||
            email.includes(
              searchValue
            ) ||
            registerNumber.includes(
              searchValue
            );


          const matchesDepartment =
            department === "All" ||
            studentDepartment ===
              department;


          const matchesYear =
            year === "All" ||
            String(studentYear) ===
              year;


          const matchesStatus =
            status === "All" ||

            (
              status === "Active" &&
              student.isActive !== false
            ) ||

            (
              status === "Inactive" &&
              student.isActive === false
            );


          return (
            matchesSearch &&
            matchesDepartment &&
            matchesYear &&
            matchesStatus
          );
        }
      );
    }, [
      students,
      search,
      department,
      year,
      status,
    ]);


  // ==========================================
  // DASHBOARD COUNTS
  // ==========================================

  const stats = useMemo(() => {
    const total =
      students.length;


    const active =
      students.filter(
        (student) =>
          student.isActive !== false
      ).length;


    const inactive =
      students.filter(
        (student) =>
          student.isActive === false
      ).length;


    const departmentsCount =
      new Set(
        students
          .map(
            (student) =>
              student.department
          )
          .filter(Boolean)
      ).size;


    return {
      total,
      active,
      inactive,
      departments:
        departmentsCount,
    };

  }, [students]);


  // ==========================================
  // DEPARTMENT OPTIONS
  // ==========================================

  const departments = useMemo(() => {
    return [
      ...new Set(
        students
          .map(
            (student) =>
              student.department
          )
          .filter(Boolean)
      ),
    ].sort();

  }, [students]);


  // ==========================================
  // OPEN STUDENT DETAILS
  // ==========================================

  const openStudentDetails =
    async (studentId) => {
      try {
        setDetailsLoading(true);
        setError("");


        const token =
          getToken();


        if (!token) {
          throw new Error(
            "Login token not found. Please login again."
          );
        }


        const response = await fetch(
          `${API_URL}/admin/students/${studentId}`,
          {
            method: "GET",

            credentials: "include",

            headers:
              getAuthHeaders(),
          }
        );


        const data =
          await response.json();


        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load student details"
          );
        }


        setSelectedStudent(
          data.student
        );


        setStudentActivity(
          data.activity || {
            totalRegistrations: 0,
            totalCertificates: 0,
            registrations: [],
            certificates: [],
          }
        );

      } catch (err) {
        console.error(
          "STUDENT DETAILS ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to load student details"
        );

      } finally {
        setDetailsLoading(false);
      }
    };


  // ==========================================
  // ACTIVATE / DEACTIVATE STUDENT
  // ==========================================

  const toggleStudentStatus =
    async (student) => {
      const action =
        student.isActive === false
          ? "activate"
          : "deactivate";


      const confirmed =
        window.confirm(
          `Are you sure you want to ${action} ${
            student.fullName ||
            "this student"
          }?`
        );


      if (!confirmed) {
        return;
      }


      try {
        setUpdatingId(
          student._id
        );

        setError("");


        const token =
          getToken();


        if (!token) {
          throw new Error(
            "Login token not found. Please login again."
          );
        }


        const response = await fetch(
          `${API_URL}/admin/users/${student._id}/status`,
          {
            method: "PATCH",

            credentials: "include",

            headers:
              getAuthHeaders(),
          }
        );


        const data =
          await response.json();


        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to update account status"
          );
        }


        const updatedIsActive =
          data.user?.isActive;


        setStudents(
          (currentStudents) =>
            currentStudents.map(
              (item) =>
                item._id ===
                student._id
                  ? {
                      ...item,

                      isActive:
                        updatedIsActive,
                    }
                  : item
            )
        );


        if (
          selectedStudent?._id ===
          student._id
        ) {
          setSelectedStudent(
            (current) => ({
              ...current,

              isActive:
                updatedIsActive,
            })
          );
        }

      } catch (err) {
        console.error(
          "UPDATE STUDENT STATUS ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to update student status"
        );

      } finally {
        setUpdatingId("");
      }
    };


  // ==========================================
  // CLOSE DETAILS MODAL
  // ==========================================

  const closeStudentDetails = () => {
    setSelectedStudent(null);
    setStudentActivity(null);
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
      "S"
    );
  };


  const formatDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return "—";
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


  const getYearLabel = (
    value
  ) => {
    if (!value) {
      return "—";
    }


    const text =
      String(value);


    if (
      text
        .toLowerCase()
        .includes("year")
    ) {
      return text;
    }


    return `Year ${text}`;
  };


  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="admin-students-page">

      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <section className="students-page-header">
        <div>
          <p className="students-eyebrow">
            STUDENT ACCOUNTS
          </p>

          <h1>
            Student Management
          </h1>

          <p className="students-subtitle">
            View, search and manage all
            student accounts from one place.
          </p>
        </div>


        <button
          className="students-refresh-button"

          onClick={
            fetchStudents
          }

          disabled={
            loading
          }
        >
          <span>↻</span>

          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </section>


      {/* ======================================
          STAT CARDS
      ====================================== */}

      <section className="student-stats-grid">

        <article className="student-stat-card">
          <div className="student-stat-icon">
            ◎
          </div>

          <div>
            <span>
              Total Students
            </span>

            <strong>
              {stats.total}
            </strong>
          </div>
        </article>


        <article className="student-stat-card">
          <div className="student-stat-icon">
            ✓
          </div>

          <div>
            <span>
              Active Accounts
            </span>

            <strong>
              {stats.active}
            </strong>
          </div>
        </article>


        <article className="student-stat-card">
          <div className="student-stat-icon">
            ○
          </div>

          <div>
            <span>
              Inactive Accounts
            </span>

            <strong>
              {stats.inactive}
            </strong>
          </div>
        </article>


        <article className="student-stat-card">
          <div className="student-stat-icon">
            ◇
          </div>

          <div>
            <span>
              Departments
            </span>

            <strong>
              {stats.departments}
            </strong>
          </div>
        </article>
      </section>


      {/* ======================================
          FILTERS
      ====================================== */}

      <section className="student-filters-card">

        <div className="student-search-box">
          <span>⌕</span>

          <input
            type="text"

            placeholder="Search name, register number or email..."

            value={search}

            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />


          {search && (
            <button
              type="button"

              onClick={() =>
                setSearch("")
              }
            >
              ×
            </button>
          )}
        </div>


        <select
          value={department}

          onChange={(event) =>
            setDepartment(
              event.target.value
            )
          }
        >
          <option value="All">
            All Departments
          </option>


          {departments.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            )
          )}
        </select>


        <select
          value={year}

          onChange={(event) =>
            setYear(
              event.target.value
            )
          }
        >
          <option value="All">
            All Years
          </option>

          <option value="1">
            Year 1
          </option>

          <option value="2">
            Year 2
          </option>

          <option value="3">
            Year 3
          </option>

          <option value="4">
            Year 4
          </option>
        </select>


        <select
          value={status}

          onChange={(event) =>
            setStatus(
              event.target.value
            )
          }
        >
          <option value="All">
            All Status
          </option>

          <option value="Active">
            Active
          </option>

          <option value="Inactive">
            Inactive
          </option>
        </select>
      </section>


      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div className="students-error-banner">
          <div>
            <strong>
              Something went wrong
            </strong>

            <span>
              {error}
            </span>
          </div>


          <button
            onClick={
              fetchStudents
            }
          >
            Try Again
          </button>
        </div>
      )}


      {/* ======================================
          STUDENTS TABLE
      ====================================== */}

      <section className="students-list-card">

        <div className="students-list-heading">
          <div>
            <p>
              ACCOUNT DIRECTORY
            </p>

            <h2>
              All Students
            </h2>
          </div>


          <span>
            {filteredStudents.length}{" "}

            {filteredStudents.length === 1
              ? "student"
              : "students"}
          </span>
        </div>


        {loading ? (
          <div className="students-state">

            <div className="students-loader" />

            <h3>
              Loading students...
            </h3>

            <p>
              Fetching student accounts
              from MongoDB.
            </p>
          </div>

        ) : filteredStudents.length === 0 ? (

          <div className="students-state">
            <div className="students-state-icon">
              ◎
            </div>

            <h3>
              No students found
            </h3>

            <p>
              No student account matches
              the selected filters.
            </p>
          </div>

        ) : (

          <div className="students-table-wrapper">

            <table className="students-table">

              <thead>
                <tr>
                  <th>Student</th>
                  <th>Department</th>
                  <th>Academic</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>


              <tbody>
                {filteredStudents.map(
                  (student) => (
                    <tr
                      key={
                        student._id
                      }
                    >

                      <td>
                        <div className="student-identity">

                          <div className="student-avatar">
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
                              {student.email}
                            </small>
                          </div>
                        </div>
                      </td>


                      <td>
                        <strong className="student-department">
                          {student.department ||
                            "—"}
                        </strong>
                      </td>


                      <td>
                        <div className="student-academic">
                          <strong>
                            {getYearLabel(
                              student.year
                            )}
                          </strong>

                          <span>
                            Section{" "}
                            {student.section ||
                              "—"}
                          </span>
                        </div>
                      </td>


                      <td>
                        <span className="student-date">
                          {formatDate(
                            student.createdAt
                          )}
                        </span>
                      </td>


                      <td>
                        <span
                          className={`student-status ${
                            student.isActive ===
                            false
                              ? "inactive"
                              : "active"
                          }`}
                        >
                          {student.isActive ===
                          false
                            ? "INACTIVE"
                            : "ACTIVE"}
                        </span>
                      </td>


                      <td>
                        <div className="student-actions">

                          <button
                            className="student-view-button"

                            onClick={() =>
                              openStudentDetails(
                                student._id
                              )
                            }

                            disabled={
                              detailsLoading
                            }
                          >
                            View
                          </button>


                          <button
                            className={`student-status-button ${
                              student.isActive ===
                              false
                                ? "activate"
                                : "deactivate"
                            }`}

                            onClick={() =>
                              toggleStudentStatus(
                                student
                              )
                            }

                            disabled={
                              updatingId ===
                              student._id
                            }
                          >
                            {updatingId ===
                            student._id
                              ? "Saving..."
                              : student.isActive ===
                                false
                              ? "Activate"
                              : "Deactivate"}
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


      {/* ======================================
          STUDENT DETAILS MODAL
      ====================================== */}

      {selectedStudent && (
        <div
          className="student-modal-backdrop"

          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeStudentDetails();
            }
          }}
        >

          <div className="student-details-modal">

            <div className="student-modal-header">
              <div>
                <p>
                  STUDENT PROFILE
                </p>

                <h2>
                  Account Details
                </h2>
              </div>


              <button
                onClick={
                  closeStudentDetails
                }
              >
                ×
              </button>
            </div>


            <div className="student-profile-hero">

              <div className="student-profile-avatar">
                {getInitial(
                  selectedStudent.fullName
                )}
              </div>


              <div>
                <h3>
                  {selectedStudent.fullName}
                </h3>

                <p>
                  {selectedStudent.email}
                </p>


                <span
                  className={`student-status ${
                    selectedStudent.isActive ===
                    false
                      ? "inactive"
                      : "active"
                  }`}
                >
                  {selectedStudent.isActive ===
                  false
                    ? "INACTIVE"
                    : "ACTIVE"}
                </span>
              </div>
            </div>


            <div className="student-profile-grid">

              <div>
                <span>
                  Register Number
                </span>

                <strong>
                  {selectedStudent.registerNumber ||
                    "—"}
                </strong>
              </div>


              <div>
                <span>
                  Department
                </span>

                <strong>
                  {selectedStudent.department ||
                    "—"}
                </strong>
              </div>


              <div>
                <span>
                  Year
                </span>

                <strong>
                  {getYearLabel(
                    selectedStudent.year
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Section
                </span>

                <strong>
                  {selectedStudent.section ||
                    "—"}
                </strong>
              </div>


              <div>
                <span>
                  Phone
                </span>

                <strong>
                  {selectedStudent.phone ||
                    "—"}
                </strong>
              </div>


              <div>
                <span>
                  Joined
                </span>

                <strong>
                  {formatDate(
                    selectedStudent.createdAt
                  )}
                </strong>
              </div>

            </div>


            <div className="student-activity-stats">

              <article>
                <span>
                  Event Registrations
                </span>

                <strong>
                  {studentActivity
                    ?.totalRegistrations ||
                    0}
                </strong>
              </article>


              <article>
                <span>
                  Certificates
                </span>

                <strong>
                  {studentActivity
                    ?.totalCertificates ||
                    0}
                </strong>
              </article>

            </div>


            <div className="student-modal-section">

              <div className="student-modal-section-heading">
                <h3>
                  Recent Registrations
                </h3>
              </div>


              {!studentActivity
                ?.registrations
                ?.length ? (

                <div className="student-mini-empty">
                  No event registrations yet.
                </div>

              ) : (

                <div className="student-activity-list">

                  {studentActivity
                    .registrations
                    .slice(0, 5)
                    .map(
                      (
                        registration
                      ) => (

                        <div
                          key={
                            registration._id
                          }

                          className="student-activity-item"
                        >

                          <div>
                            <strong>
                              {registration
                                .event
                                ?.title ||
                                "Unknown Event"}
                            </strong>

                            <span>
                              {registration
                                .event
                                ?.venue ||
                                "—"}
                            </span>
                          </div>


                          <span>
                            {registration.status ||
                              "Registered"}
                          </span>

                        </div>
                      )
                    )}

                </div>
              )}
            </div>


            <div className="student-modal-footer">

              <button
                className="student-modal-close"

                onClick={
                  closeStudentDetails
                }
              >
                Close
              </button>


              <button
                className={`student-modal-status ${
                  selectedStudent.isActive ===
                  false
                    ? "activate"
                    : "deactivate"
                }`}

                onClick={() =>
                  toggleStudentStatus(
                    selectedStudent
                  )
                }

                disabled={
                  updatingId ===
                  selectedStudent._id
                }
              >
                {updatingId ===
                selectedStudent._id
                  ? "Updating..."
                  : selectedStudent.isActive ===
                    false
                  ? "Activate Account"
                  : "Deactivate Account"}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}


export default AdminStudents;