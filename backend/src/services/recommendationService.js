const Program = require("../models/Program");
const Student = require("../models/Student");
const HttpError = require("../utils/httpError");

async function buildProgramRecommendations(studentId) {
  const student = await Student.findById(studentId).lean();

  if (!student) {
    throw new HttpError(404, "Student not found.");
  }

  const targetCountries = student.targetCountries || [];
  const interestedFields = student.interestedFields || [];
  const preferredIntake = student.preferredIntake || "";
  const maxBudgetUsd = Number(student.maxBudgetUsd || 0);
  const englishScore = Number(student.englishTest?.score || 0);

  const recommendations = await Program.aggregate([
    {
      $match: {
        country: { $in: targetCountries },
      },
    },

    {
      $addFields: {
        countryScore: {
          $cond: [
            { $in: ["$country", targetCountries] },
            35,
            0,
          ],
        },

        fieldScore: {
          $cond: [
            {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: interestedFields,
                      as: "field",
                      cond: {
                        $regexMatch: {
                          input: "$field",
                          regex: "$$field",
                          options: "i",
                        },
                      },
                    },
                  },
                },
                0,
              ],
            },
            30,
            0,
          ],
        },

        budgetScore: {
          $cond: [
            {
              $gte: [
                maxBudgetUsd,
                "$tuitionFeeUsd",
              ],
            },
            20,
            0,
          ],
        },

        intakeScore: {
          $cond: [
            {
              $and: [
                { $ne: [preferredIntake, ""] },
                { $in: [preferredIntake, "$intakes"] },
              ],
            },
            10,
            0,
          ],
        },

        ieltsScore: {
          $cond: [
            {
              $gte: [
                englishScore,
                "$minimumIelts",
              ],
            },
            5,
            0,
          ],
        },
      },
    },

    {
      $addFields: {
        matchScore: {
          $add: [
            "$countryScore",
            "$fieldScore",
            "$budgetScore",
            "$intakeScore",
            "$ieltsScore",
          ],
        },
      },
    },

    {
      $addFields: {
        reasons: {
          $concatArrays: [
            {
              $cond: [
                { $eq: ["$countryScore", 35] },
                ["Preferred country match"],
                [],
              ],
            },

            {
              $cond: [
                { $eq: ["$fieldScore", 30] },
                ["Field alignment"],
                [],
              ],
            },

            {
              $cond: [
                { $eq: ["$budgetScore", 20] },
                ["Within budget range"],
                [],
              ],
            },

            {
              $cond: [
                { $eq: ["$intakeScore", 10] },
                ["Preferred intake available"],
                [],
              ],
            },

            {
              $cond: [
                { $eq: ["$ieltsScore", 5] },
                ["English test score meets requirement"],
                [],
              ],
            },
          ],
        },
      },
    },

    {
      $sort: {
        matchScore: -1,
        tuitionFeeUsd: 1,
      },
    },

    {
      $limit: 5,
    },

    {
      $project: {
        countryScore: 0,
        fieldScore: 0,
        budgetScore: 0,
        intakeScore: 0,
        ieltsScore: 0,
      },
    },
  ]);

  return {
    data: {
      student: {
        id: student._id,
        fullName: student.fullName,
        targetCountries: student.targetCountries,
        interestedFields: student.interestedFields,
      },
      recommendations,
    },
    meta: {
      implementationStatus:
        "mongodb-aggregation-based-recommendation-scoring",
    },
  };
}

module.exports = {
  buildProgramRecommendations,
};