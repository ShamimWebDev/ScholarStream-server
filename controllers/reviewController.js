const Review = require("../models/Review");
const User = require("../models/User");

const addReview = async (req, res) => {
  try {
    const review = new Review(req.body);
    const result = await review.save();
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to add review", error: err.message });
  }
};

const editReview = async (req, res) => {
  try {
    const filter = {
      _id: req.params.id,
      userEmail: req.decoded.email,
    };
    const updateDoc = {
      ratingPoint: req.body.ratingPoint,
      reviewComment: req.body.reviewComment,
      reviewDate: Date.now(),
    };
    const result = await Review.findOneAndUpdate(filter, updateDoc, {
      new: true,
    });
    if (!result)
      return res
        .status(404)
        .send({ message: "Review not found or not editable" });
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to edit review", error: err.message });
  }
};

const getReviewsByScholarship = async (req, res) => {
  try {
    const result = await Review.find({
      scholarshipId: req.params.scholarshipId,
    });
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to fetch reviews", error: err.message });
  }
};

const getReviewsByUser = async (req, res) => {
  try {
    if (req.params.email !== req.decoded.email)
      return res.status(403).send({ message: "forbidden access" });
    const result = await Review.find({ userEmail: req.params.email });
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to fetch user reviews", error: err.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).send({ message: "Review not found" });

    if (review.userEmail !== req.decoded.email) {
      const user = await User.findOne({ email: req.decoded.email });
      if (!["admin", "moderator"].includes(user?.role))
        return res.status(403).send({ message: "forbidden access" });
    }

    const result = await Review.findByIdAndDelete(req.params.id);
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to delete review", error: err.message });
  }
};

const getAllReviews = async (req, res) => {
  try {
    // Verify user is moderator or admin
    const user = await User.findOne({ email: req.decoded.email });
    if (!["admin", "moderator"].includes(user?.role)) {
      return res.status(403).send({ message: "forbidden access" });
    }

    // Fetch all reviews sorted by date (newest first)
    const result = await Review.find({}).sort({ reviewDate: -1 });
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to fetch reviews", error: err.message });
  }
};

const getAllPublicReviews = async (req, res) => {
  try {
    // Public endpoint - no authentication required
    // Fetch all reviews for displaying on scholarship cards
    const result = await Review.find({}).select("-userEmail"); // Exclude email for privacy
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to fetch reviews", error: err.message });
  }
};

module.exports = {
  addReview,
  editReview,
  getReviewsByScholarship,
  getReviewsByUser,
  deleteReview,
  getAllReviews,
  getAllPublicReviews,
};
