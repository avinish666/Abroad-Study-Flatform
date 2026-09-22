const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateAIRecommendations(student, programs) {
  const studentProfile = {
    name: student.fullName,
    targetCountries: student.targetCountries || [],
    interestedFields: student.interestedFields || [],
    preferredIntake: student.preferredIntake || null,
    maxBudgetUsd: Number(student.maxBudgetUsd || 0),
    englishTest: student.englishTest || {},
  };

  const programData = programs.map((program) => ({
    id: program._id.toString(),
    university: program.universityName,
    country: program.country,
    city: program.city,
    title: program.title,
    field: program.field,
    degreeLevel: program.degreeLevel,
    tuitionFeeUsd: program.tuitionFeeUsd,
    intakes: program.intakes,
    minimumIelts: program.minimumIelts,
    scholarshipAvailable: program.scholarshipAvailable,
    stem: program.stem,
    matchScore: program.matchScore,
    reasons: program.reasons,
  }));

  const prompt = `
You are an international education recommendation assistant.

Analyze the student's profile against the provided programs.

IMPORTANT:
- Use ONLY the program information supplied below.
- Never invent tuition fees, IELTS requirements, intakes, universities,
  scholarships, rankings, or eligibility requirements.
- Do not recommend a program if the student's IELTS score is below
  the program's minimum IELTS requirement.
- Do not describe a program as within budget if its tuition exceeds
  the student's maximum budget.
- Explain recommendations using factual matches.
- Return valid JSON only.

Student:
${JSON.stringify(studentProfile, null, 2)}

Programs:
${JSON.stringify(programData, null, 2)}

Return this structure:

{
  "summary": "short personalized summary",
  "recommendations": [
    {
      "programId": "program id",
      "title": "program title",
      "university": "university name",
      "matchScore": 0,
      "whyRecommended": [
        "reason 1",
        "reason 2",
        "reason 3"
      ],
      "considerations": [
        "important consideration"
      ]
    }
  ]
}

Return at most 5 recommendations.
`;

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
    input: prompt,
  });

  const text = response.output_text;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("AI returned invalid recommendation JSON.");
  }
}

module.exports = {
  generateAIRecommendations,
};