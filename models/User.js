const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    photoURL: { type: String },
    role: {
      type: String,
      enum: ["student", "moderator", "admin", "Student", "Moderator", "Admin"],
      default: "student",
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Scholarship",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
