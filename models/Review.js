const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    scholarshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scholarship",
      required: true,
    },
    scholarshipName: { type: String },
    universityName: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userImage: { type: String, required: true },
    ratingPoint: { type: Number, required: true, min: 1, max: 5 },
    reviewComment: { type: String, required: true },
    reviewDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
