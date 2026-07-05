import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./StudentCertificates.css";

const API_URL = "http://gtecsphere-backend.onrender.com/api/certificates";

const filters = ["All", "Issued", "Revoked"];

function StudentCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // GET TOKEN
  // ==========================================
  const getToken = () => {
    return localStorage.getItem("token");
  };

  // ==========================================
  // LOAD REAL CERTIFICATES FROM BACKEND
  // GET /api/certificates/my-certificates
  // ==========================================
  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Login session not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/my-certificates`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "Certificate API returned an invalid response."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load your certificates."
        );
      }

      // Supports:
      // [ ... ]
      // { certificates: [ ... ] }
      // { data: [ ... ] }
      const certificateList = Array.isArray(data)
        ? data
        : Array.isArray(data.certificates)
        ? data.certificates
        : Array.isArray(data.data)
        ? data.data
        : [];

      setCertificates(certificateList);
    } catch (err) {
      console.error(
        "Certificate loading error:",
        err
      );

      setCertificates([]);

      setError(
        err.message ||
          "Something went wrong while loading certificates."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // LOAD ON PAGE OPEN
  // ==========================================
  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // ==========================================
  // NORMALIZE BACKEND CERTIFICATE
  // ==========================================
  const normalizedCertificates = useMemo(() => {
    return certificates.map((certificate) => {
      const event = certificate.event || {};

      return {
        id:
          certificate._id ||
          certificate.id ||
          certificate.certificateNumber,

        title:
          event.title ||
          event.eventName ||
          certificate.title ||
          "Campus Event",

        category:
          event.category ||
          event.eventType ||
          "Certificate",

        issuer:
          certificate.issuedBy?.fullName ||
          event.department ||
          "GtecSphere",

        certificateId:
          certificate.certificateNumber ||
          certificate.certificateId ||
          certificate._id ||
          "N/A",

        status:
          certificate.status || "Issued",

        issuedDate: certificate.issuedAt
          ? new Date(
              certificate.issuedAt
            ).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "Not available",

        raw: certificate,
      };
    });
  }, [certificates]);

  // ==========================================
  // FILTER CERTIFICATES
  // ==========================================
  const filteredCertificates = useMemo(() => {
    return normalizedCertificates.filter(
      (certificate) => {
        const search =
          searchTerm.trim().toLowerCase();

        const matchesSearch =
          certificate.title
            .toLowerCase()
            .includes(search) ||
          certificate.issuer
            .toLowerCase()
            .includes(search) ||
          certificate.certificateId
            .toLowerCase()
            .includes(search);

        const matchesFilter =
          activeFilter === "All" ||
          certificate.status === activeFilter;

        return matchesSearch && matchesFilter;
      }
    );
  }, [
    normalizedCertificates,
    searchTerm,
    activeFilter,
  ]);

  // ==========================================
  // LIVE STATS
  // ==========================================
  const totalCertificates =
    normalizedCertificates.length;

  const issuedCertificates =
    normalizedCertificates.filter(
      (item) => item.status === "Issued"
    ).length;

  const revokedCertificates =
    normalizedCertificates.filter(
      (item) => item.status === "Revoked"
    ).length;

  // ==========================================
  // VIEW CERTIFICATE
  // ==========================================
  const handleView = (certificate) => {
    console.log(
      "Selected certificate:",
      certificate.raw
    );

    alert(
      `Certificate Number: ${certificate.certificateId}`
    );
  };

  // ==========================================
  // DOWNLOAD
  // TEMPORARY UNTIL PDF ROUTE IS ADDED
  // ==========================================
  const handleDownload = (certificate) => {
    alert(
      `PDF download will be connected next.\n\nCertificate: ${certificate.certificateId}`
    );
  };

  return (
    <div className="certificates-page">
      {/* ======================================
          HERO
      ====================================== */}

      <section className="certificates-hero">
        <div className="certificates-hero-content">
          <p className="certificates-eyebrow">
            YOUR ACHIEVEMENTS
          </p>

          <h1>
            Certificates that tell
            <span> your story.</span>
          </h1>

          <p>
            View and verify certificates earned
            through your campus activities and
            events.
          </p>
        </div>

        <div className="certificates-hero-decoration">
          <span>◇</span>
        </div>
      </section>

      {/* ======================================
          LIVE STATS
      ====================================== */}

      <section className="certificate-stats">
        <article>
          <div className="certificate-stat-icon">
            ◇
          </div>

          <div>
            <p>Total Certificates</p>
            <h3>{totalCertificates}</h3>
          </div>
        </article>

        <article>
          <div className="certificate-stat-icon">
            ✓
          </div>

          <div>
            <p>Issued</p>
            <h3>{issuedCertificates}</h3>
          </div>
        </article>

        <article>
          <div className="certificate-stat-icon">
            ◷
          </div>

          <div>
            <p>Revoked</p>
            <h3>{revokedCertificates}</h3>
          </div>
        </article>
      </section>

      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <section className="certificates-empty">
          <div>!</div>

          <h3>Unable to load certificates</h3>

          <p>{error}</p>

          <button
            type="button"
            onClick={fetchCertificates}
          >
            Try Again
          </button>
        </section>
      )}

      {/* ======================================
          CONTROLS
      ====================================== */}

      {!error && (
        <>
          <section className="certificate-controls">
            <div className="certificate-search">
              <span>⌕</span>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search certificates..."
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

            <div className="certificate-filters">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={
                    activeFilter === filter
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveFilter(filter)
                  }
                >
                  {filter}
                </button>
              ))}
            </div>
          </section>

          {/* ==================================
              RESULTS
          ================================== */}

          <section className="certificates-results">
            <div className="certificates-section-heading">
              <div>
                <p>ACHIEVEMENTS</p>
                <h2>My Certificates</h2>
              </div>

              <span>
                {filteredCertificates.length}{" "}
                certificates
              </span>
            </div>

            {/* LOADING */}

            {loading ? (
              <div className="certificates-empty">
                <div>◇</div>

                <h3>
                  Loading your certificates...
                </h3>

                <p>
                  Connecting to GtecSphere.
                </p>
              </div>
            ) : filteredCertificates.length > 0 ? (
              /* CERTIFICATE GRID */

              <div className="certificates-grid">
                {filteredCertificates.map(
                  (certificate) => (
                    <article
                      className="certificate-card"
                      key={certificate.id}
                    >
                      <div className="certificate-card-header">
                        <div className="certificate-logo">
                          G
                        </div>

                        <span
                          className={`certificate-status ${certificate.status.toLowerCase()}`}
                        >
                          <i />

                          {certificate.status}
                        </span>
                      </div>

                      <div className="certificate-card-body">
                        <p className="certificate-category">
                          {certificate.category}
                        </p>

                        <h3>
                          {certificate.title}
                        </h3>

                        <p className="certificate-issuer">
                          Issued by{" "}
                          {certificate.issuer}
                        </p>

                        <div className="certificate-info">
                          <div>
                            <span>ISSUED</span>

                            <strong>
                              {
                                certificate.issuedDate
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              CERTIFICATE ID
                            </span>

                            <strong>
                              {
                                certificate.certificateId
                              }
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="certificate-card-footer">
                        <button
                          type="button"
                          className="certificate-view-button"
                          onClick={() =>
                            handleView(
                              certificate
                            )
                          }
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="certificate-download-button"
                          onClick={() =>
                            handleDownload(
                              certificate
                            )
                          }
                        >
                          Download
                          <span>↓</span>
                        </button>
                      </div>
                    </article>
                  )
                )}
              </div>
            ) : (
              /* EMPTY STATE */

              <div className="certificates-empty">
                <div>◇</div>

                <h3>
                  No certificates found
                </h3>

                <p>
                  {certificates.length === 0
                    ? "Your issued certificates will appear here."
                    : "No certificate matches the selected filters."}
                </p>

                {(searchTerm ||
                  activeFilter !== "All") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setActiveFilter("All");
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default StudentCertificates;