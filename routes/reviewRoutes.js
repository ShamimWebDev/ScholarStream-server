const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/", verifyToken, reviewController.addReview);
router.patch("/:id", verifyToken, reviewController.editReview);
router.get(
  "/scholarship/:scholarshipId",
  reviewController.getReviewsByScholarship
);
router.get("/user/:email", verifyToken, reviewController.getReviewsByUser);
router.get("/all", verifyToken, reviewController.getAllReviews);
router.get("/all-public", reviewController.getAllPublicReviews);
router.delete("/:id", verifyToken, reviewController.deleteReview);

module.exports = router;
