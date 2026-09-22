const jwt = require("jsonwebtoken");

const Student = require("../models/Student");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const env = require("../config/env");


// ======================================================
// CREATE JWT TOKEN
// ======================================================

function createToken(student) {
  return jwt.sign(
    {
      sub: student._id.toString(),
      role: student.role,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    }
  );
}


// ======================================================
// REGISTER STUDENT
// ======================================================

const register = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    password,
    targetCountries,
    interestedFields,
    preferredIntake,
    maxBudgetUsd,
    englishTest,
  } = req.body;

  // Validate required fields
  if (!fullName || !email || !password) {
    throw new HttpError(
      400,
      "fullName, email and password are required."
    );
  }

  // Check whether email already exists
  const existingStudent = await Student.findOne({
    email: email.toLowerCase().trim(),
  });

  if (existingStudent) {
    throw new HttpError(
      409,
      "A student with this email already exists."
    );
  }

  // Public registration always creates a STUDENT
  const student = await Student.create({
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    password,

    role: "student",

    targetCountries: targetCountries || [],
    interestedFields: interestedFields || [],
    preferredIntake,
    maxBudgetUsd,
    englishTest,
  });

  // Create JWT
  const token = createToken(student);

  // Send response
  res.status(201).json({
    success: true,
    data: {
      token,

      student: {
        id: student._id,
        fullName: student.fullName,
        email: student.email,
        role: student.role,
        targetCountries: student.targetCountries,
        interestedFields: student.interestedFields,
        preferredIntake: student.preferredIntake,
        maxBudgetUsd: student.maxBudgetUsd,
        englishTest: student.englishTest,
        profileComplete: student.profileComplete,
      },
    },
  });
});


// ======================================================
// LOGIN
// ======================================================

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new HttpError(
      400,
      "Email and password are required."
    );
  }

  const student = await Student.findOne({
    email: email.toLowerCase().trim(),
  });

  if (!student) {
    throw new HttpError(
      401,
      "Invalid email or password."
    );
  }

  const passwordMatches =
    await student.comparePassword(password);

  if (!passwordMatches) {
    throw new HttpError(
      401,
      "Invalid email or password."
    );
  }

  const token = createToken(student);

  res.json({
    success: true,
    data: {
      token,

      student: {
        id: student._id,
        fullName: student.fullName,
        email: student.email,
        role: student.role,
        targetCountries: student.targetCountries,
        interestedFields: student.interestedFields,
        preferredIntake: student.preferredIntake,
        maxBudgetUsd: student.maxBudgetUsd,
        englishTest: student.englishTest,
        profileComplete: student.profileComplete,
      },
    },
  });
});


// ======================================================
// CURRENT USER
// ======================================================

const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      student: req.user,
    },
  });
});


// ======================================================
// EXPORT
// ======================================================

module.exports = {
  register,
  login,
  me,
};