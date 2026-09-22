const Application = require("../models/Application");
const Student = require("../models/Student");
const Program = require("../models/Program");
const University = require("../models/University");

const { validStatusTransitions } = require("../config/constants");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

const populateApplication = (query) =>
  query
    .populate("student", "fullName email role")
    .populate(
      "program",
      "title degreeLevel tuitionFeeUsd country field minimumIelts intakes"
    )
    .populate("university", "name country city");


// ======================================================
// GET APPLICATIONS
// ======================================================

const listApplications = asyncHandler(async (req, res) => {
  const {
    status,
    search,
    page = 1,
    limit = 20,
  } = req.query;

  const currentPage = Math.max(Number(page), 1);
  const perPage = Math.min(Math.max(Number(limit), 1), 100);

  const filters = {};

  // Student -> only own applications
  if (req.user.role === "student") {
    filters.student = req.user._id;
  }

  // Status filter
  if (status) {
    filters.status = status;
  }

  let query = Application.find(filters);

  // Search is primarily useful for counselors
  if (search && req.user.role === "counselor") {
    const students = await Student.find({
      $or: [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    filters.student = {
      $in: students.map((student) => student._id),
    };

    query = Application.find(filters);
  }
  const total = await Application.countDocuments(filters);

  const applications = await populateApplication(
    query
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
  ).lean();

  res.json({
    success: true,
    data: {
      applications,
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    },
  });
});


// ======================================================
// GET SINGLE APPLICATION
// ======================================================

const getApplication = asyncHandler(async (req, res) => {
  const application = await populateApplication(
    Application.findById(req.params.id)
  ).lean();

  if (!application) {
    throw new HttpError(404, "Application not found.");
  }

  // Students can only view their own application
  if (
    req.user.role === "student" &&
    application.student._id.toString() !== req.user._id.toString()
  ) {
    throw new HttpError(
      403,
      "You do not have permission to view this application."
    );
  }

  res.json({
    success: true,
    data: application,
  });
});


// ======================================================
// CREATE APPLICATION
// ======================================================

const createApplication = asyncHandler(async (req, res) => {
  const {
    studentId,
    programId,
    universityId,
    destinationCountry,
    intake,
  } = req.body;

  const actualStudentId =
    req.user.role === "counselor"
      ? studentId
      : req.user._id.toString();

  if (
    !actualStudentId ||
    !programId ||
    !universityId ||
    !destinationCountry ||
    !intake
  ) {
    throw new HttpError(
      400,
      "studentId, programId, universityId, destinationCountry and intake are required."
    );
  }

  const [student, program, university] = await Promise.all([
    Student.findById(actualStudentId),
    Program.findById(programId),
    University.findById(universityId),
  ]);

  if (!student) {
    throw new HttpError(404, "Student not found.");
  }

  if (!program) {
    throw new HttpError(404, "Program not found.");
  }

  if (!university) {
    throw new HttpError(404, "University not found.");
  }

  if (
    program.university.toString() !==
    university._id.toString()
  ) {
    throw new HttpError(
      400,
      "The selected program does not belong to the selected university."
    );
  }

  if (!program.intakes.includes(intake)) {
    throw new HttpError(
      400,
      "Selected intake is not available for this program."
    );
  }

  try {
    const application = await Application.create({
      student: actualStudentId,
      program: programId,
      university: universityId,
      destinationCountry,
      intake,
      status: "draft",
    });

    const populatedApplication = await populateApplication(
      Application.findById(application._id)
    ).lean();

    res.status(201).json({
      success: true,
      data: populatedApplication,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new HttpError(
        409,
        "An application for this program and intake already exists."
      );
    }

    throw error;
  }
});


// ======================================================
// UPDATE APPLICATION STATUS
// COUNSELOR ONLY FOR COUNSELOR WORKFLOW
// ======================================================

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!status) {
    throw new HttpError(400, "status is required.");
  }

  const application = await Application.findById(id);

  if (!application) {
    throw new HttpError(404, "Application not found.");
  }

  // Counselor can update applications
  if (req.user.role === "counselor") {
    // allowed
  }

  // Student can only submit their draft application
  else if (req.user.role === "student") {
    if (
      application.student.toString() !==
      req.user._id.toString()
    ) {
      throw new HttpError(
        403,
        "You cannot modify this application."
      );
    }

    // Students cannot perform counselor decisions
    const counselorOnlyStatuses = [
      "under-review",
      "offer-received",
      "visa-processing",
      "enrolled",
      "rejected",
    ];

    if (counselorOnlyStatuses.includes(status)) {
      throw new HttpError(
        403,
        "Only counselors can perform this status transition."
      );
    }
  }

  const allowed =
    validStatusTransitions[application.status] || [];

  if (!allowed.includes(status)) {
    throw new HttpError(
      400,
      `Invalid status transition from ${application.status} to ${status}.`
    );
  }

  application.status = status;

  application.timeline.push({
    status,
    note:
      note ||
      `Application status changed to ${status}.`,
    changedAt: new Date(),
  });

  await application.save();

  const updatedApplication = await populateApplication(
    Application.findById(application._id)
  ).lean();

  res.json({
    success: true,
    data: updatedApplication,
  });
});


module.exports = {
  createApplication,
  listApplications,
  getApplication,
  updateApplicationStatus,
};