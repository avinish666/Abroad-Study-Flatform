const mongoose = require("mongoose");

const env = require("./src/config/env");
const Student = require("./src/models/Student");

async function createCounselor() {
  try {
    await mongoose.connect(env.mongoUri);

    const email = "counselor@waygood.com";

    const existing = await Student.findOne({ email });

    if (existing) {
      console.log("Counselor already exists.");
      process.exit(0);
    }
    const counselor = await Student.create({
      fullName: "Waygood Counselor",
      email,
      password: "Counselor@123",
      role: "counselor",
    });

    console.log("Counselor created successfully.");
    console.log("Email:", counselor.email);
    console.log("Role:", counselor.role);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error creating counselor:", error);
    process.exit(1);
  }
}

createCounselor();