const asyncHandler = require("../utils/asyncHandler");
const Student = require("../models/Student");
const Program = require("../models/Program");

const {
  buildProgramRecommendations,
} = require("../services/recommendationService");

const {
  generateAIRecommendations,
} = require("../services/aiRecommendationService");

const getRecommendations = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id).lean();

  if (!student) {
    return res.status(404).json({
      success: false,
      message: "Student not found.",
    });
  }

  // First use our deterministic MongoDB recommendation engine.
  const baseResult = await buildProgramRecommendations(req.user._id);

  const programs = baseResult.data.recommendations;

  // Then let AI personalize the explanation.
  if (!process.env.OPENAI_API_KEY) {
    return res.json({
      success: true,
      data: baseResult.data,
      meta: {
        ...baseResult.meta,
        aiEnabled: false,
        message:
          "AI is not configured. Showing database recommendation results.",
      },
    });
  }

  const aiResult = await generateAIRecommendations(
    student,
    programs
  );

  res.json({
    success: true,
    data: {
      student: baseResult.data.student,
      recommendations: aiResult.recommendations,
      summary: aiResult.summary,
    },
    meta: {
      ...baseResult.meta,
      aiEnabled: true,
    },
  });
});

module.exports = {
  getRecommendations,
};