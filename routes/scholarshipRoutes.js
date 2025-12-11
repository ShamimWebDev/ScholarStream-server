const express = require("express");
const router = express.Router();
const scholarshipController = require("../controllers/scholarshipController");
const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");

router.get("/all", scholarshipController.getAllScholarships);
router.get("/top", scholarshipController.getTopScholarships);
router.get("/:id", scholarshipController.getScholarshipById);
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  scholarshipController.addScholarship
);
router.patch(
  "/:id",
  verifyToken,
  verifyAdmin,
  scholarshipController.updateScholarship
);
router.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  scholarshipController.deleteScholarship
);

module.exports = router;
