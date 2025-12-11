const User = require("../models/User");
const Scholarship = require("../models/Scholarship");
const Application = require("../models/Application");
const Review = require("../models/Review");

const getAdminStats = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const scholarships = await Scholarship.countDocuments();
    const applications = await Application.countDocuments();

    const payments = await Application.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$applicationFees" } } },
    ]);
    const revenue = payments.length ? payments[0].totalRevenue : 0;

    res.send({ users, scholarships, applications, revenue });
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to fetch stats", error: err.message });
  }
};

const getAnalyticsChart = async (req, res) => {
  try {
    const result = await Application.aggregate([
      { $group: { _id: "$scholarshipCategory", count: { $sum: 1 } } },
    ]);
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to fetch chart data", error: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    // Get totals
    const users = await User.countDocuments();
    const scholarships = await Scholarship.countDocuments();
    const applications = await Application.countDocuments();
    const reviews = await Review.countDocuments();

    // Calculate total fees collected from paid applications
    const feesData = await Application.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: null,
          totalFees: { $sum: "$applicationFees" },
          totalService: { $sum: "$serviceCharge" },
        },
      },
    ]);
    const totalFeesCollected =
      feesData.length > 0
        ? feesData[0].totalFees + feesData[0].totalService
        : 0;

    // Applications by category
    const appsByCategory = await Application.aggregate([
      { $group: { _id: "$scholarshipCategory", count: { $sum: 1 } } },
    ]);
    const applicationsByCategory = appsByCategory.map((item) => ({
      name: item._id || "Unknown",
      value: item.count,
    }));

    // Applications by status
    const appsByStatus = await Application.aggregate([
      { $group: { _id: "$applicationStatus", count: { $sum: 1 } } },
    ]);
    const applicationsByStatus = appsByStatus.map((item) => ({
      name: item._id || "Unknown",
      value: item.count,
    }));

    // Scholarships by category
    const schByCategory = await Scholarship.aggregate([
      { $group: { _id: "$scholarshipCategory", count: { $sum: 1 } } },
    ]);
    const scholarshipsByCategory = schByCategory.map((item) => ({
      name: item._id || "Unknown",
      value: item.count,
    }));

    // Applications by university
    const appsByUniversity = await Application.aggregate([
      { $group: { _id: "$universityName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }, // Top 10 universities
    ]);
    const applicationsByUniversity = appsByUniversity.map((item) => ({
      name: item._id || "Unknown",
      value: item.count,
    }));

    res.send({
      totals: {
        users,
        scholarships,
        applications,
        reviews,
        totalFeesCollected,
      },
      applicationsByCategory,
      applicationsByStatus,
      scholarshipsByCategory,
      applicationsByUniversity,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res
      .status(500)
      .send({ message: "Failed to fetch analytics", error: err.message });
  }
};

module.exports = { getAdminStats, getAnalyticsChart, getStats };
