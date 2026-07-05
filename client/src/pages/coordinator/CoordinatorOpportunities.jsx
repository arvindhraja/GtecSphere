import { useMemo, useState } from "react";
import "./CoordinatorOpportunities.css";

const initialOpportunities = [
  {
    id: 1,
    title: "Frontend Developer Internship",
    organization: "TechNova Labs",
    type: "Internship",
    mode: "Hybrid",
    location: "Bengaluru",
    deadline: "2026-07-25",
    description:
      "Work with React and modern frontend technologies on real-world products.",
    eligibility: "2nd, 3rd and 4th year students",
    link: "https://example.com/apply",
    status: "published",
  },
  {
    id: 2,
    title: "AI Innovation Hackathon",
    organization: "GtecSphere",
    type: "Hackathon",
    mode: "Offline",
    location: "College Campus",
    deadline: "2026-08-10",
    description:
      "Build innovative AI solutions and compete with student teams.",
    eligibility: "All departments",
    link: "",
    status: "draft",
  },
];

const emptyForm = {
  title: "",
  organization: "",
  type: "Internship",
  mode: "Offline",
  location: "",
  deadline: "",
  description: "",
  eligibility: "",
  link: "",
};

function CoordinatorOpportunities() {
  const [opportunities, setOpportunities] =
    useState(initialOpportunities);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const publishedCount = opportunities.filter(
    (item) => item.status === "published"
  ).length;

  const draftCount = opportunities.filter(
    (item) => item.status === "draft"
  ).length;

  const closingSoonCount = opportunities.filter((item) => {
    if (!item.deadline) return false;

    const today = new Date();
    const deadline = new Date(item.deadline);
    const difference = deadline - today;
    const daysLeft = difference / (1000 * 60 * 60 * 24);

    return daysLeft >= 0 && daysLeft <= 7;
  }).length;

  const filteredOpportunities = useMemo(() => {
    const searchValue = searchTerm.toLowerCase().trim();

    return opportunities.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchValue) ||
        item.organization.toLowerCase().includes(searchValue) ||
        item.location.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      const matchesType =
        typeFilter === "all" || item.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [opportunities, searchTerm, statusFilter, typeFilter]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (opportunity) => {
    setEditingId(opportunity.id);

    setFormData({
      title: opportunity.title,
      organization: opportunity.organization,
      type: opportunity.type,
      mode: opportunity.mode,
      location: opportunity.location,
      deadline: opportunity.deadline,
      description: opportunity.description,
      eligibility: opportunity.eligibility,
      link: opportunity.link,
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const saveOpportunity = (event) => {
    event.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.organization.trim() ||
      !formData.deadline
    ) {
      alert(
        "Please enter the title, organization and application deadline."
      );
      return;
    }

    if (editingId) {
      setOpportunities((previousItems) =>
        previousItems.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...formData,
              }
            : item
        )
      );
    } else {
      const newOpportunity = {
        id: Date.now(),
        ...formData,
        status: "draft",
      };

      setOpportunities((previousItems) => [
        newOpportunity,
        ...previousItems,
      ]);
    }

    closeForm();
  };

  const togglePublishStatus = (id) => {
    setOpportunities((previousItems) =>
      previousItems.map((item) =>
        item.id === id
          ? {
              ...item,
              status:
                item.status === "published"
                  ? "draft"
                  : "published",
            }
          : item
      )
    );
  };

  const deleteOpportunity = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this opportunity?"
    );

    if (!confirmed) return;

    setOpportunities((previousItems) =>
      previousItems.filter((item) => item.id !== id)
    );
  };

  const getDaysLeft = (deadlineValue) => {
    if (!deadlineValue) return "No deadline";

    const today = new Date();
    const deadline = new Date(deadlineValue);

    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    const difference = deadline - today;
    const days = Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

    if (days < 0) return "Closed";
    if (days === 0) return "Closes today";
    if (days === 1) return "1 day left";

    return `${days} days left`;
  };

  return (
    <div className="coordinator-opportunities-page">
      {/* HEADER */}
      <section className="opportunities-page-header">
        <div>
          <p className="opportunities-eyebrow">
            CAREER & GROWTH
          </p>

          <h1>Opportunity Management</h1>

          <p>
            Create and manage internships, jobs, hackathons,
            scholarships and workshops.
          </p>
        </div>

        <button
          className="create-opportunity-button"
          onClick={openCreateForm}
        >
          <span>+</span>
          Add Opportunity
        </button>
      </section>

      {/* SUMMARY */}
      <section className="opportunity-summary-grid">
        <article>
          <span>↗</span>

          <div>
            <p>Total Opportunities</p>
            <h3>{opportunities.length}</h3>
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
          <span>!</span>

          <div>
            <p>Closing Soon</p>
            <h3>{closingSoonCount}</h3>
          </div>
        </article>
      </section>

      {/* TOOLBAR */}
      <section className="opportunity-toolbar">
        <div className="opportunity-search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search opportunity or organization..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </div>

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value)
          }
        >
          <option value="all">All Types</option>
          <option value="Internship">Internship</option>
          <option value="Job">Job</option>
          <option value="Hackathon">Hackathon</option>
          <option value="Scholarship">Scholarship</option>
          <option value="Workshop">Workshop</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </section>

      {/* LIST */}
      <section className="opportunity-list-panel">
        <div className="opportunity-panel-heading">
          <div>
            <p>MANAGE</p>
            <h2>All Opportunities</h2>
          </div>

          <span>
            {filteredOpportunities.length} opportunit
            {filteredOpportunities.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {filteredOpportunities.length === 0 ? (
          <div className="opportunity-empty-state">
            <div>↗</div>
            <h3>No opportunities found</h3>
            <p>
              Create a new opportunity or change your filters.
            </p>

            <button onClick={openCreateForm}>
              + Add Opportunity
            </button>
          </div>
        ) : (
          <div className="opportunity-card-grid">
            {filteredOpportunities.map((opportunity) => (
              <article
                className="opportunity-management-card"
                key={opportunity.id}
              >
                <div className="opportunity-card-top">
                  <span className="opportunity-type-badge">
                    {opportunity.type}
                  </span>

                  <span
                    className={`opportunity-status-badge ${opportunity.status}`}
                  >
                    {opportunity.status === "published"
                      ? "● Published"
                      : "○ Draft"}
                  </span>
                </div>

                <div className="opportunity-card-content">
                  <div className="opportunity-company-icon">
                    {opportunity.organization
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h3>{opportunity.title}</h3>
                    <p>{opportunity.organization}</p>
                  </div>
                </div>

                <div className="opportunity-meta-grid">
                  <div>
                    <span>Mode</span>
                    <strong>{opportunity.mode}</strong>
                  </div>

                  <div>
                    <span>Location</span>
                    <strong>{opportunity.location || "—"}</strong>
                  </div>

                  <div>
                    <span>Deadline</span>
                    <strong>{opportunity.deadline}</strong>
                  </div>

                  <div>
                    <span>Time Left</span>
                    <strong>
                      {getDaysLeft(opportunity.deadline)}
                    </strong>
                  </div>
                </div>

                <p className="opportunity-description">
                  {opportunity.description ||
                    "No description added yet."}
                </p>

                <div className="opportunity-eligibility">
                  <span>Eligibility</span>
                  <strong>
                    {opportunity.eligibility ||
                      "Not specified"}
                  </strong>
                </div>

                <div className="opportunity-card-actions">
                  <button
                    className="edit-opportunity-button"
                    onClick={() =>
                      openEditForm(opportunity)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className={
                      opportunity.status === "published"
                        ? "unpublish-opportunity-button"
                        : "publish-opportunity-button"
                    }
                    onClick={() =>
                      togglePublishStatus(opportunity.id)
                    }
                  >
                    {opportunity.status === "published"
                      ? "Unpublish"
                      : "Publish"}
                  </button>

                  <button
                    className="delete-opportunity-button"
                    onClick={() =>
                      deleteOpportunity(opportunity.id)
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* CREATE / EDIT MODAL */}
      {showForm && (
        <div
          className="opportunity-modal-overlay"
          onMouseDown={closeForm}
        >
          <div
            className="opportunity-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="opportunity-modal-header">
              <div>
                <p>
                  {editingId
                    ? "UPDATE OPPORTUNITY"
                    : "NEW OPPORTUNITY"}
                </p>

                <h2>
                  {editingId
                    ? "Edit Opportunity"
                    : "Create Opportunity"}
                </h2>
              </div>

              <button onClick={closeForm}>×</button>
            </div>

            <form
              className="opportunity-form"
              onSubmit={saveOpportunity}
            >
              <div className="opportunity-form-grid">
                <label className="opportunity-full-field">
                  <span>Opportunity Title *</span>

                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Example: Software Developer Internship"
                  />
                </label>

                <label>
                  <span>Organization *</span>

                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    placeholder="Organization name"
                  />
                </label>

                <label>
                  <span>Opportunity Type</span>

                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option>Internship</option>
                    <option>Job</option>
                    <option>Hackathon</option>
                    <option>Scholarship</option>
                    <option>Workshop</option>
                  </select>
                </label>

                <label>
                  <span>Mode</span>

                  <select
                    name="mode"
                    value={formData.mode}
                    onChange={handleInputChange}
                  >
                    <option>Offline</option>
                    <option>Online</option>
                    <option>Hybrid</option>
                  </select>
                </label>

                <label>
                  <span>Location</span>

                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Bengaluru / Remote / Campus"
                  />
                </label>

                <label>
                  <span>Application Deadline *</span>

                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                  />
                </label>

                <label>
                  <span>Eligibility</span>

                  <input
                    type="text"
                    name="eligibility"
                    value={formData.eligibility}
                    onChange={handleInputChange}
                    placeholder="Example: 3rd and 4th year students"
                  />
                </label>

                <label className="opportunity-full-field">
                  <span>Application Link</span>

                  <input
                    type="url"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </label>

                <label className="opportunity-full-field">
                  <span>Description</span>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Write opportunity details..."
                    rows="5"
                  />
                </label>
              </div>

              <div className="opportunity-form-actions">
                <button
                  type="button"
                  className="cancel-opportunity-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-opportunity-button"
                >
                  {editingId
                    ? "Save Changes"
                    : "Create Opportunity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INFO */}
      <section className="opportunity-info-card">
        <span>i</span>

        <div>
          <h3>Student visibility</h3>

          <p>
            Only published opportunities will be visible in the
            Student Portal. MongoDB and API integration will connect
            both portals later.
          </p>
        </div>
      </section>
    </div>
  );
}

export default CoordinatorOpportunities;