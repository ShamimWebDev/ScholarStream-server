const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");

router.get(
  "/admin-stats",
  verifyToken,
  verifyAdmin,
  analyticsController.getAdminStats
);
router.get(
  "/analytics-chart",
  verifyToken,
  verifyAdmin,
  analyticsController.getAnalyticsChart
);
router.get("/stats", verifyToken, verifyAdmin, analyticsController.getStats);

module.exports = router;
