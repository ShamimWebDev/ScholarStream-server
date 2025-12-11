const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const {
  verifyToken,
  verifyModerator,
} = require("../middlewares/authMiddleware");

router.post("/", verifyToken, applicationController.saveApplication);
router.get(
  "/user/:email",
  verifyToken,
  applicationController.getApplicationsByUser
);
router.get(
  "/all",
  verifyToken,
  verifyModerator,
  applicationController.getAllApplications
);
router.get("/:id", verifyToken, applicationController.getApplicationById);
router.patch(
  "/feedback/:id",
  verifyToken,
  verifyModerator,
  applicationController.updateApplicationStatus
);
router.patch("/:id", verifyToken, applicationController.editApplication);
router.delete("/:id", verifyToken, applicationController.deleteApplication);

module.exports = router;
