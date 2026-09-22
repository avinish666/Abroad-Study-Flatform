const express = require("express");

const {
  createApplication,
  listApplications,
  getApplication,
  updateApplicationStatus,
} = require("../controllers/applicationController");

const {
  requireAuth,
  requireRole,
} = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", listApplications);

router.get(
  "/counselor",
  requireRole("counselor"),
  listApplications
);

router.get("/:id", getApplication);

router.post("/", createApplication);

router.patch(
  "/:id/status",
  updateApplicationStatus
);

module.exports = router;