const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    scholarshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scholarship",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    scholarshipName: { type: String, required: true },
    universityName: { type: String, required: true },
    subjectCategory: { type: String, required: true },
    scholarshipCategory: { type: String, required: true },
    degree: { type: String, required: true },
    applicationFees: { type: Number, required: true },
    serviceCharge: { type: Number, required: true },
    applicationStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    applicationDate: { type: Date, default: Date.now },
    feedback: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
