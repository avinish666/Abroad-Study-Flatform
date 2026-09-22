import React, { useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  Link,
  useNavigate,
} from "react-router-dom";

import InfoCard from "./components/InfoCard.jsx";
import SignalStrip from "./components/SignalStrip.jsx";
import SpotlightList from "./components/SpotlightList.jsx";

import SignUp from "./pages/SignUp.jsx";
import SignIn from "./pages/SignIn.jsx";

import {
  assignmentSignals,
  featureCards,
  productSignals,
  universitySpotlights,
} from "./data/sampleData.js";

// ======================================================

// ======================================================
// API HELPER
// ======================================================

async function api(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        "Something went wrong."
    );
  }

  return data;
}

// ======================================================
// STATUS TRANSITIONS
// ======================================================

function getNextStatuses(status) {
  const transitions = {
    draft: ["submitted"],

    submitted: [
      "under-review",
      "rejected",
    ],

    "under-review": [
      "offer-received",
      "rejected",
    ],

    "offer-received": [
      "visa-processing",
      "rejected",
    ],

    "visa-processing": [
      "enrolled",
      "rejected",
    ],

    enrolled: [],

    rejected: [],
  };

  return transitions[status] || [];
}

// ======================================================
// FORMAT STATUS
// ======================================================

function formatStatus(status) {
  if (!status) return "";

  return status
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

// ======================================================
// AI RECOMMENDATIONS
// ======================================================

function CourseRecommendations() {
  const [recommendations, setRecommendations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api(
        "/recommendations"
      );

      setRecommendations(
        response?.data?.recommendations || []
      );
    } catch (err) {
      console.error(
        "Recommendation error:",
        err
      );

      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  return (
    <section className="section">

      <div className="section-heading">

        <p className="eyebrow">
          🤖 AI Recommendation
        </p>

        <h2>
          Courses Recommended For You
        </h2>

        <p>
          Our recommendation system analyzes
          your preferred countries, interested
          fields, budget, intake and English
          test score.
        </p>

      </div>

      {/* LOADING */}

      {loading && (
        <div className="hero-panel">

          <h3>
            🤖 AI is analyzing your profile...
          </h3>

          <p>
            Finding suitable study programs
            for you.
          </p>

        </div>
      )}

      {/* ERROR */}

      {!loading && error && (
        <div className="hero-panel">

          <h3>
            Recommendation System Error
          </h3>

          <p>
            {error}
          </p>

          <button
            onClick={loadRecommendations}
          >
            Try Again
          </button>

        </div>
      )}

      {/* NO RESULTS */}

      {!loading &&
        !error &&
        recommendations.length === 0 && (
          <div className="hero-panel">

            <h3>
              No recommendations yet
            </h3>

            <p>
              Update your student profile with
              target countries, interested
              fields, budget and English score.
            </p>

          </div>
        )}

      {/* RESULTS */}

      {!loading &&
        !error &&
        recommendations.length > 0 && (

          <div className="card-grid">

            {recommendations.map(
              (program) => (

                <div
                  key={program._id}
                  className="hero-panel"
                >

                  <p className="panel-label">
                    🤖 AI MATCH
                  </p>

                  <h3>
                    {program.title}
                  </h3>

                  <p>
                    <strong>
                      Match Score:
                    </strong>{" "}
                    {program.matchScore}%
                  </p>

                  <p>
                    <strong>
                      University:
                    </strong>{" "}
                    {program.universityName}
                  </p>

                  <p>
                    <strong>
                      Country:
                    </strong>{" "}
                    {program.country}
                  </p>

                  <p>
                    <strong>
                      City:
                    </strong>{" "}
                    {program.city}
                  </p>

                  <p>
                    <strong>
                      Field:
                    </strong>{" "}
                    {program.field}
                  </p>

                  <p>
                    <strong>
                      Degree:
                    </strong>{" "}
                    {program.degreeLevel}
                  </p>

                  <p>
                    <strong>
                      Tuition:
                    </strong>{" "}
                    ${program.tuitionFeeUsd}
                  </p>

                  <p>
                    <strong>
                      Minimum IELTS:
                    </strong>{" "}
                    {program.minimumIelts}
                  </p>

                  <p>
                    <strong>
                      Intake:
                    </strong>{" "}
                    {program.intakes?.join(
                      ", "
                    ) || "Not specified"}
                  </p>

                  {program.scholarshipAvailable && (
                    <p>
                      🎓 Scholarship Available
                    </p>
                  )}

                  {/* REASONS */}

                  {program.reasons?.length > 0 && (

                    <div>

                      <p>
                        <strong>
                          Why AI recommended
                          this:
                        </strong>
                      </p>

                      <ul>

                        {program.reasons.map(
                          (reason, index) => (

                            <li
                              key={index}
                            >
                              ✓ {reason}
                            </li>

                          )
                        )}

                      </ul>

                    </div>

                  )}

                  <button
                    onClick={() => {
                      window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: "smooth",
                      });
                    }}
                  >
                    View Application Options
                  </button>

                </div>

              )
            )}

          </div>

        )}

    </section>
  );
}

// ======================================================
// STUDENT APPLICATIONS
// ======================================================

function StudentApplications({
  student,
}) {

  const [programs, setPrograms] =
    useState([]);

  const [applications, setApplications] =
    useState([]);

  const [loadingPrograms, setLoadingPrograms] =
    useState(true);

  const [loadingApplications, setLoadingApplications] =
    useState(true);

  const [
    selectedProgram,
    setSelectedProgram,
  ] = useState(null);

  const [
    selectedIntake,
    setSelectedIntake,
  ] = useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // ====================================================
  // LOAD PROGRAMS
  // ====================================================

  const loadPrograms = async () => {

    try {

      setLoadingPrograms(true);

      const response =
        await api("/programs?limit=20");

      setPrograms(
        response?.data || []
      );

    } catch (err) {

      console.error(err);

      setError(err.message);

    } finally {

      setLoadingPrograms(false);

    }

  };

  // ====================================================
  // LOAD APPLICATIONS
  // ====================================================

  const loadApplications = async () => {

    try {

      setLoadingApplications(true);

      const response =
        await api("/applications");

      setApplications(
        response?.data?.applications || []
      );

    } catch (err) {

      console.error(err);

      setError(err.message);

    } finally {

      setLoadingApplications(false);

    }

  };

  useEffect(() => {

    loadPrograms();

    loadApplications();

  }, []);

  // ====================================================
  // SELECT PROGRAM
  // ====================================================

  const handleSelectProgram = (
    program
  ) => {

    setSelectedProgram(program);

    setSelectedIntake(
      program?.intakes?.[0] || ""
    );

    setMessage("");

    setError("");

  };

  // ====================================================
  // CREATE APPLICATION
  // ====================================================

  const handleApply = async () => {

    if (!selectedProgram) {

      setError(
        "Please select a program."
      );

      return;
    }

    if (!selectedIntake) {

      setError(
        "Please select an intake."
      );

      return;
    }

    try {

      setError("");

      setMessage("");

      await api("/applications", {

        method: "POST",

        body: JSON.stringify({

          studentId:
            student?.id ||
            student?._id,

          programId:
            selectedProgram._id,

          universityId:
            selectedProgram.university,

          destinationCountry:
            selectedProgram.country,

          intake:
            selectedIntake,

        }),

      });

      setMessage(
        "Application created successfully."
      );

      setSelectedProgram(null);

      setSelectedIntake("");

      await loadApplications();

    } catch (err) {

      console.error(err);

      setError(err.message);

    }

  };

  // ====================================================
  // SUBMIT APPLICATION
  // ====================================================

  const handleSubmitApplication =
    async (application) => {

      try {

        setError("");

        setMessage("");

        await api(
          `/applications/${application._id}/status`,
          {

            method: "PATCH",

            body: JSON.stringify({

              status:
                "submitted",

              note:
                "Application submitted by student.",

            }),

          }
        );

        setMessage(
          "Application submitted successfully."
        );

        await loadApplications();

      } catch (err) {

        console.error(err);

        setError(err.message);

      }

    };

  return (
    <>

      {/* PROGRAM DISCOVERY */}

      <section className="section">

        <div className="section-heading">

          <p className="eyebrow">
            Explore Programs
          </p>

          <h2>
            Find a program to apply for
          </h2>

        </div>

        {loadingPrograms && (
          <p>
            Loading programs...
          </p>
        )}

        {!loadingPrograms &&
          programs.length === 0 && (

            <div className="hero-panel">

              <p>
                No programs are currently
                available.
              </p>

            </div>

          )}

        <div className="card-grid">

          {programs.map(
            (program) => (

              <div
                key={program._id}
                className="hero-panel"
              >

                <p className="panel-label">
                  {program.country}
                </p>

                <h3>
                  {program.title}
                </h3>

                <p>
                  <strong>
                    University:
                  </strong>{" "}
                  {program.universityName}
                </p>

                <p>
                  <strong>
                    Field:
                  </strong>{" "}
                  {program.field}
                </p>

                <p>
                  <strong>
                    Degree:
                  </strong>{" "}
                  {program.degreeLevel}
                </p>

                <p>
                  <strong>
                    Tuition:
                  </strong>{" "}
                  ${program.tuitionFeeUsd}
                </p>

                <p>
                  <strong>
                    Minimum IELTS:
                  </strong>{" "}
                  {program.minimumIelts}
                </p>

                <p>
                  <strong>
                    Intakes:
                  </strong>{" "}
                  {program.intakes?.join(
                    ", "
                  )}
                </p>

                <button
                  onClick={() =>
                    handleSelectProgram(
                      program
                    )
                  }
                >
                  Apply Now
                </button>

              </div>

            )
          )}

        </div>

      </section>

      {/* APPLICATION FORM */}

      {selectedProgram && (

        <section className="section">

          <div className="section-heading">

            <p className="eyebrow">
              Application
            </p>

            <h2>
              Apply to{" "}
              {selectedProgram.title}
            </h2>

          </div>

          <div className="hero-panel">

            <p>
              <strong>
                University:
              </strong>{" "}
              {selectedProgram.universityName}
            </p>

            <p>
              <strong>
                Country:
              </strong>{" "}
              {selectedProgram.country}
            </p>

            <label>
              Select Intake
            </label>

            <select
              value={selectedIntake}
              onChange={(event) =>
                setSelectedIntake(
                  event.target.value
                )
              }
              style={{
                padding: "12px",
                width: "100%",
                marginTop: "8px",
                marginBottom: "16px",
              }}
            >

              <option value="">
                Select an intake
              </option>

              {selectedProgram.intakes?.map(
                (intake) => (

                  <option
                    key={intake}
                    value={intake}
                  >
                    {intake}
                  </option>

                )
              )}

            </select>

            <button
              onClick={handleApply}
            >
              Create Application
            </button>

            <button
              className="secondary"
              onClick={() => {

                setSelectedProgram(null);

                setSelectedIntake("");

              }}
              style={{
                marginLeft: "10px",
              }}
            >
              Cancel
            </button>

          </div>

        </section>

      )}

      {/* MESSAGES */}

      {(message || error) && (

        <section className="section">

          {message && (

            <div className="hero-panel">

              <p>
                {message}
              </p>

            </div>

          )}

          {error && (

            <div className="hero-panel">

              <p>
                {error}
              </p>

            </div>

          )}

        </section>

      )}

      {/* APPLICATIONS */}

      <section className="section">

        <div className="section-heading">

          <p className="eyebrow">
            My Applications
          </p>

          <h2>
            Application Journey
          </h2>

        </div>

        {loadingApplications && (
          <p>
            Loading your applications...
          </p>
        )}

        {!loadingApplications &&
          applications.length === 0 && (

            <div className="hero-panel">

              <p>
                You have not created any
                applications yet.
              </p>

            </div>

          )}

        {!loadingApplications &&
          applications.map(
            (application) => (

              <div
                key={application._id}
                className="hero-panel"
                style={{
                  marginBottom: "16px",
                }}
              >

                <p className="panel-label">
                  Application
                </p>

                <h3>
                  {application.program?.title}
                </h3>

                <p>
                  <strong>
                    University:
                  </strong>{" "}
                  {application.university?.name ||
                    application.program?.universityName ||
                    "N/A"}
                </p>

                <p>
                  <strong>
                    Country:
                  </strong>{" "}
                  {application.destinationCountry ||
                    application.program?.country ||
                    "N/A"}
                </p>

                <p>
                  <strong>
                    Intake:
                  </strong>{" "}
                  {application.intake}
                </p>

                <p>
                  <strong>
                    Status:
                  </strong>{" "}
                  {formatStatus(
                    application.status
                  )}
                </p>

                {application.status ===
                  "draft" && (

                  <button
                    onClick={() =>
                      handleSubmitApplication(
                        application
                      )
                    }
                  >
                    Submit Application
                  </button>

                )}

              </div>

            )
          )}

      </section>

    </>
  );
}

// ======================================================
// COUNSELOR DASHBOARD
// ======================================================

function CounselorDashboard({
  counselor,
}) {

  const [applications, setApplications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [
    selectedApplication,
    setSelectedApplication,
  ] = useState(null);

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("");

  const [note, setNote] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // ====================================================
  // LOAD APPLICATIONS
  // ====================================================

  const loadApplications = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await api(
          "/applications/counselor"
        );

      setApplications(
        response?.data?.applications || []
      );

    } catch (err) {

      console.error(err);

      setError(err.message);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadApplications();

  }, []);

  // ====================================================
  // FILTER
  // ====================================================

  const filteredApplications =
    useMemo(() => {

      return applications.filter(
        (application) => {

          const searchText =
            search.toLowerCase();

          const studentName =
            application.student?.fullName
              ?.toLowerCase() || "";

          const studentEmail =
            application.student?.email
              ?.toLowerCase() || "";

          const programName =
            application.program?.title
              ?.toLowerCase() || "";

          const universityName =
            application.university?.name
              ?.toLowerCase() || "";

          const matchesSearch =
            !searchText ||
            studentName.includes(searchText) ||
            studentEmail.includes(searchText) ||
            programName.includes(searchText) ||
            universityName.includes(searchText);

          const matchesStatus =
            statusFilter === "all" ||
            application.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );

        }
      );

    }, [
      applications,
      search,
      statusFilter,
    ]);

  // ====================================================
  // STATISTICS
  // ====================================================

  const totalApplications =
    applications.length;

  const submittedApplications =
    applications.filter(
      (application) =>
        application.status ===
        "submitted"
    ).length;

  const underReviewApplications =
    applications.filter(
      (application) =>
        application.status ===
        "under-review"
    ).length;

  const acceptedApplications =
    applications.filter(
      (application) =>
        application.status ===
        "offer-received"
    ).length;

  const rejectedApplications =
    applications.filter(
      (application) =>
        application.status ===
        "rejected"
    ).length;

  // ====================================================
  // OPEN APPLICATION
  // ====================================================

  const openApplication =
    (application) => {

      setSelectedApplication(
        application
      );

      setSelectedStatus(
        getNextStatuses(
          application.status
        )[0] || ""
      );

      setNote("");

      setMessage("");

      setError("");

    };

  // ====================================================
  // UPDATE STATUS
  // ====================================================

  const updateApplicationStatus =
    async () => {

      if (!selectedApplication)
        return;

      if (!selectedStatus) {

        setError(
          "Please select a new status."
        );

        return;

      }

      try {

        setError("");

        setMessage("");

        await api(
          `/applications/${selectedApplication._id}/status`,
          {

            method: "PATCH",

            body: JSON.stringify({

              status:
                selectedStatus,

              note:
                note ||
                `Application status changed to ${selectedStatus}.`,

            }),

          }
        );

        setMessage(
          "Application status updated successfully."
        );

        await loadApplications();

        const updated =
          await api(
            `/applications/${selectedApplication._id}`
          );

        setSelectedApplication(
          updated.data
        );

        setSelectedStatus("");

        setNote("");

      } catch (err) {

        console.error(err);

        setError(err.message);

      }

    };

  const handleLogout = () => {

    localStorage.removeItem("token");

    localStorage.removeItem(
      "student"
    );

    window.location.href =
      "/signin";

  };

  return (

    <main className="page-shell">

      {/* NAVIGATION */}

      <nav className="top-nav">

        <div className="brand">
          Waygood
        </div>

        <div className="nav-actions">

          <span className="welcome-text">
            Welcome,{" "}
            {counselor?.fullName}
          </span>

          <button
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </nav>

      {/* HERO */}

      <section className="hero">

        <div className="hero-copy">

          <p className="eyebrow">
            Counselor Dashboard
          </p>

          <h1>
            Manage student applications.
          </h1>

          <p className="hero-text">
            Review applications,
            monitor progress and
            help students complete
            their study-abroad journey.
          </p>

        </div>

        <div className="hero-panel">

          <p className="panel-label">
            Counselor Account
          </p>

          <ul>

            <li>
              Name:{" "}
              {counselor?.fullName}
            </li>

            <li>
              Email:{" "}
              {counselor?.email}
            </li>

            <li>
              Role:{" "}
              {counselor?.role}
            </li>

          </ul>

        </div>

      </section>

      {/* STATISTICS */}

      <section className="section">

        <div className="section-heading">

          <p className="eyebrow">
            Overview
          </p>

          <h2>
            Application Statistics
          </h2>

        </div>

        <div className="card-grid">

          <InfoCard
            title="Total Applications"
            body={String(
              totalApplications
            )}
          />

          <InfoCard
            title="Submitted"
            body={String(
              submittedApplications
            )}
          />

          <InfoCard
            title="Under Review"
            body={String(
              underReviewApplications
            )}
          />

          <InfoCard
            title="Offers"
            body={String(
              acceptedApplications
            )}
          />

          <InfoCard
            title="Rejected"
            body={String(
              rejectedApplications
            )}
          />

        </div>

      </section>

      {/* APPLICATIONS */}

      <section className="section">

        <div className="section-heading">

          <p className="eyebrow">
            Student Applications
          </p>

          <h2>
            Registered Applications
          </h2>

        </div>

        {/* SEARCH */}

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >

          <input
            type="text"
            placeholder="Search student, email, university..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            style={{
              flex: 1,
              minWidth: "250px",
              padding: "12px",
            }}
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            style={{
              padding: "12px",
            }}
          >

            <option value="all">
              All Statuses
            </option>

            <option value="draft">
              Draft
            </option>

            <option value="submitted">
              Submitted
            </option>

            <option value="under-review">
              Under Review
            </option>

            <option value="offer-received">
              Offer Received
            </option>

            <option value="visa-processing">
              Visa Processing
            </option>

            <option value="enrolled">
              Enrolled
            </option>

            <option value="rejected">
              Rejected
            </option>

          </select>

        </div>

        {message && (

          <div className="hero-panel">

            <p>
              {message}
            </p>

          </div>

        )}

        {error && (

          <div className="hero-panel">

            <p>
              {error}
            </p>

          </div>

        )}

        {loading && (
          <p>
            Loading applications...
          </p>
        )}

        {!loading &&
          filteredApplications.length ===
            0 && (

            <div className="hero-panel">

              <p>
                No applications found.
              </p>

            </div>

          )}

        {!loading &&
          filteredApplications.map(
            (application) => (

              <div
                key={application._id}
                className="hero-panel"
                style={{
                  marginBottom: "16px",
                }}
              >

                <p className="panel-label">
                  Student
                </p>

                <h3>
                  {application.student?.fullName ||
                    "Unknown Student"}
                </h3>

                <p>
                  {application.student?.email}
                </p>

                <p>
                  <strong>
                    Program:
                  </strong>{" "}
                  {application.program?.title}
                </p>

                <p>
                  <strong>
                    University:
                  </strong>{" "}
                  {application.university?.name}
                </p>

                <p>
                  <strong>
                    Status:
                  </strong>{" "}
                  {formatStatus(
                    application.status
                  )}
                </p>

                <button
                  onClick={() =>
                    openApplication(
                      application
                    )
                  }
                >
                  View Application
                </button>

              </div>

            )
          )}

      </section>

      {/* APPLICATION DETAILS */}

      {selectedApplication && (

        <section className="section">

          <div className="section-heading">

            <p className="eyebrow">
              Application Details
            </p>

            <h2>
              {
                selectedApplication
                  .student?.fullName
              }
            </h2>

          </div>

          <div className="card-grid">

            <div className="hero-panel">

              <p className="panel-label">
                Student
              </p>

              <p>
                <strong>
                  Name:
                </strong>{" "}
                {
                  selectedApplication
                    .student?.fullName
                }
              </p>

              <p>
                <strong>
                  Email:
                </strong>{" "}
                {
                  selectedApplication
                    .student?.email
                }
              </p>

            </div>

            <div className="hero-panel">

              <p className="panel-label">
                Program
              </p>

              <p>
                <strong>
                  Program:
                </strong>{" "}
                {
                  selectedApplication
                    .program?.title
                }
              </p>

              <p>
                <strong>
                  University:
                </strong>{" "}
                {
                  selectedApplication
                    .university?.name
                }
              </p>

              <p>
                <strong>
                  Country:
                </strong>{" "}
                {
                  selectedApplication
                    .university?.country
                }
              </p>

              <p>
                <strong>
                  Intake:
                </strong>{" "}
                {
                  selectedApplication.intake
                }
              </p>

            </div>

          </div>

          {/* STATUS */}

          <div className="hero-panel">

            <p className="panel-label">
              Current Status
            </p>

            <h3>
              {formatStatus(
                selectedApplication.status
              )}
            </h3>

          </div>

          {/* TIMELINE */}

          <div className="section">

            <div className="section-heading">

              <p className="eyebrow">
                Application Journey
              </p>

              <h2>
                Status History
              </h2>

            </div>

            {selectedApplication.timeline?.map(
              (item, index) => (

                <div
                  key={index}
                  className="hero-panel"
                  style={{
                    marginBottom: "12px",
                  }}
                >

                  <h3>
                    {formatStatus(
                      item.status
                    )}
                  </h3>

                  <p>
                    {item.note}
                  </p>

                  <small>
                    {item.changedAt
                      ? new Date(
                          item.changedAt
                        ).toLocaleString()
                      : ""}
                  </small>

                </div>

              )
            )}

          </div>

          {/* UPDATE STATUS */}

          {getNextStatuses(
            selectedApplication.status
          ).length > 0 && (

            <div className="hero-panel">

              <p className="panel-label">
                Counselor Action
              </p>

              <h2>
                Update Application
              </h2>

              <select
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(
                    event.target.value
                  )
                }
                style={{
                  padding: "12px",
                  width: "100%",
                  marginBottom: "12px",
                }}
              >

                <option value="">
                  Select next status
                </option>

                {getNextStatuses(
                  selectedApplication.status
                ).map(
                  (status) => (

                    <option
                      key={status}
                      value={status}
                    >
                      {formatStatus(
                        status
                      )}
                    </option>

                  )
                )}

              </select>

              <textarea
                placeholder="Add a counselor note..."
                value={note}
                onChange={(event) =>
                  setNote(
                    event.target.value
                  )
                }
                rows={5}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "12px",
                }}
              />

              <button
                onClick={
                  updateApplicationStatus
                }
              >
                Update Application
              </button>

            </div>

          )}

          <button
            className="secondary"
            onClick={() =>
              setSelectedApplication(
                null
              )
            }
            style={{
              marginTop: "20px",
            }}
          >
            Close Application
          </button>

        </section>

      )}

    </main>
  );
}

// ======================================================
// STUDENT DASHBOARD
// ======================================================

function Dashboard() {

  const navigate =
    useNavigate();

  const student = JSON.parse(
    localStorage.getItem(
      "student"
    ) || "null"
  );

  // ====================================================
  // STUDENT SIDEBAR PAGE
  // ====================================================

  const [activePage, setActivePage] =
    useState("home");

  // ====================================================
  // LOGOUT
  // ====================================================

  const handleLogout = () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "student"
    );

    navigate("/signin");

  };

  // ====================================================
  // COUNSELOR
  // ====================================================

  if (
    student?.role ===
    "counselor"
  ) {

    return (
      <CounselorDashboard
        counselor={student}
      />
    );

  }

  // ====================================================
  // STUDENT DASHBOARD
  // ====================================================

  return (

    <main className="page-shell">

      {/* TOP NAVIGATION */}

      <nav className="top-nav">

        <div className="brand">
          Waygood
        </div>

        <div className="nav-actions">

          {student && (

            <span className="welcome-text">

              Welcome,{" "}
              {student.fullName}

            </span>

          )}

          <button
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </nav>

      {/* MAIN DASHBOARD LAYOUT */}

      <div
        style={{
          display: "flex",
          gap: "24px",
          alignItems: "flex-start",
        }}
      >

        {/* =================================================
            LEFT SIDEBAR
        ================================================= */}

        <aside
          style={{
            width: "230px",
            minWidth: "230px",
            position: "sticky",
            top: "20px",
          }}
        >

          <div
            className="hero-panel"
            style={{
              padding: "18px",
            }}
          >

            <p className="panel-label">
              MENU
            </p>

            {/* HOME */}

            <button
              className="sidebar-item"
              onClick={() =>
                setActivePage(
                  "home"
                )
              }
              style={{
                width: "100%",
                marginBottom: "10px",
                textAlign: "left",
              }}
            >

              <span>
                🏠
              </span>

              <span>
                Dashboard
              </span>

            </button>

            {/* AI RECOMMENDATION */}

            <button
              className="sidebar-item"
              onClick={() =>
                setActivePage(
                  "recommendations"
                )
              }
              style={{
                width: "100%",
                marginBottom: "10px",
                textAlign: "left",
              }}
            >

              <span>
                🤖
              </span>

              <span>
                AI Recommendation
              </span>

            </button>

            {/* APPLICATIONS */}

            <button
              className="sidebar-item"
              onClick={() =>
                setActivePage(
                  "applications"
                )
              }
              style={{
                width: "100%",
                marginBottom: "10px",
                textAlign: "left",
              }}
            >

              <span>
                📄
              </span>

              <span>
                My Applications
              </span>

            </button>

            {/* PROGRAMS */}

            <button
              className="sidebar-item"
              onClick={() =>
                setActivePage(
                  "programs"
                )
              }
              style={{
                width: "100%",
                marginBottom: "10px",
                textAlign: "left",
              }}
            >

              <span>
                🎓
              </span>

              <span>
                Programs
              </span>

            </button>

          </div>

        </aside>

        {/* =================================================
            RIGHT CONTENT
        ================================================= */}

        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >

          {/* ===============================================
              HOME PAGE
          =============================================== */}

          {activePage ===
            "home" && (

            <>

              <section className="hero">

                <div className="hero-copy">

                  <p className="eyebrow">
                    Student Dashboard
                  </p>

                  <h1>
                    Build your
                    study-abroad journey
                    with Waygood.
                  </h1>

                  <p className="hero-text">
                    Discover universities,
                    explore programs,
                    receive personalized
                    recommendations and
                    track your applications.
                  </p>

                </div>

                <div className="hero-panel">

                  <p className="panel-label">
                    Account
                  </p>

                  {student ? (

                    <ul>

                      <li>
                        Name:{" "}
                        {student.fullName}
                      </li>

                      <li>
                        Email:{" "}
                        {student.email}
                      </li>

                      <li>
                        Role:{" "}
                        {student.role}
                      </li>

                    </ul>

                  ) : (

                    <p>
                      Please sign in.
                    </p>

                  )}

                </div>

              </section>

              {/* PRODUCT SIGNALS */}

              <SignalStrip
                items={
                  productSignals
                }
              />

              {/* PRODUCT DIRECTION */}

              <section className="section">

                <div className="section-heading">

                  <p className="eyebrow">
                    Product Direction
                  </p>

                  <h2>
                    Study-abroad platform
                    areas
                  </h2>

                </div>

                <div className="card-grid">

                  {featureCards.map(
                    (card) => (

                      <InfoCard
                        key={
                          card.title
                        }
                        title={
                          card.title
                        }
                        body={
                          card.body
                        }
                      />

                    )
                  )}

                </div>

              </section>

              {/* UNIVERSITY SPOTLIGHT */}

              <section className="section">

                <div className="section-heading">

                  <p className="eyebrow">
                    Sample destinations
                  </p>

                  <h2>
                    University examples
                  </h2>

                </div>

                <SpotlightList
                  items={
                    universitySpotlights
                  }
                />

              </section>

              {/* BACKEND */}

              <section className="section">

                <div className="hero-panel">

                  <p className="panel-label">
                    Backend capabilities
                  </p>

                  <ul>

                    {assignmentSignals.map(
                      (signal) => (

                        <li
                          key={signal}
                        >
                          {signal}
                        </li>

                      )
                    )}

                  </ul>

                </div>

              </section>

            </>

          )}

          {/* ===============================================
              AI RECOMMENDATION PAGE
          =============================================== */}

          {activePage ===
            "recommendations" && (

            <CourseRecommendations />

          )}

          {/* ===============================================
              APPLICATION PAGE
          =============================================== */}

          {activePage ===
            "applications" && (

            <StudentApplications
              student={student}
            />

          )}

          {/* ===============================================
              PROGRAM PAGE
          =============================================== */}

          {activePage ===
            "programs" && (

            <StudentApplications
              student={student}
            />

          )}

        </div>

      </div>

    </main>

  );
}

// ======================================================
// HOME
// ======================================================

function Home() {

  const navigate =
    useNavigate();

  const token =
    localStorage.getItem(
      "token"
    );

  return (

    <main className="page-shell">

      <nav className="top-nav">

        <div className="brand">
          Waygood
        </div>

        <div className="nav-actions">

          {token ? (

            <button
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
            >
              Dashboard
            </button>

          ) : (

            <>

              <Link
                to="/signin"
                className="auth-link-button"
              >
                Sign In
              </Link>

              <Link
                to="/signup"
                className="auth-link-button"
              >
                Sign Up
              </Link>

            </>

          )}

        </div>

      </nav>

      <section className="hero">

        <div className="hero-copy">

          <p className="eyebrow">
            Waygood
          </p>

          <h1>
            Your study-abroad
            journey starts here.
          </h1>

          <p className="hero-text">
            Discover universities,
            explore programs, get
            personalized AI
            recommendations and
            track your applications.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "24px",
            }}
          >

            {token ? (

              <button
                onClick={() =>
                  navigate(
                    "/dashboard"
                  )
                }
              >
                Go to Dashboard
              </button>

            ) : (

              <>

                <Link
                  to="/signup"
                  className="auth-link-button"
                >
                  Get Started
                </Link>

                <Link
                  to="/signin"
                  className="auth-link-button"
                >
                  Sign In
                </Link>

              </>

            )}

          </div>

        </div>

        <div className="hero-panel">

          <p className="panel-label">
            Platform
          </p>

          <ul>

            <li>
              University discovery
            </li>

            <li>
              Program discovery
            </li>

            <li>
              🤖 AI course recommendations
            </li>

            <li>
              Student applications
            </li>

            <li>
              Counselor management
            </li>

          </ul>

        </div>

      </section>

    </main>

  );
}

// ======================================================
// PROTECTED ROUTE
// ======================================================

function ProtectedRoute({
  children,
}) {

  const token =
    localStorage.getItem(
      "token"
    );

  if (!token) {

    return (
      <Navigate
        to="/signin"
        replace
      />
    );

  }

  return children;
}

// ======================================================
// APP
// ======================================================

function App() {

  return (

    <Routes>

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/signup"
        element={<SignUp />}
      />

      <Route
        path="/signin"
        element={<SignIn />}
      />

      <Route
        path="/dashboard"
        element={

          <ProtectedRoute>

            <Dashboard />

          </ProtectedRoute>

        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>

  );

}

export default App;
