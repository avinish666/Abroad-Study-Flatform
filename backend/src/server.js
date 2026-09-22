const app = require("./app");
const connectDatabase = require("./config/database");
const env = require("./config/env");

async function startServer() {
  try {
    await connectDatabase();

    const PORT = process.env.PORT || env.port || 4000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `Waygood evaluation API running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server",
      error
    );

    process.exit(1);
  }
}

startServer();