const Scholarship = require("../models/Scholarship");

const getAllScholarships = async (req, res) => {
  try {
    const search = req.query.search || "";
    const category = req.query.category || "";
    const country = req.query.country || "";
    const sortFees = req.query.sortFees;
    const sortDate = req.query.sortDate;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.$or = [
        { scholarshipName: { $regex: search, $options: "i" } },
        { universityName: { $regex: search, $options: "i" } },
        { degree: { $regex: search, $options: "i" } },
      ];
    }
    if (category) query.scholarshipCategory = category;
    if (country) query.universityCountry = country;

    let sortOptions = {};
    if (sortFees) {
      sortOptions.applicationFees = sortFees === "asc" ? 1 : -1;
    } else if (sortDate === "newest") {
      sortOptions.scholarshipPostDate = -1;
    }

    const scholarships = await Scholarship.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const totalScholarships = await Scholarship.countDocuments(query);

    res.send({ scholarships, totalScholarships });
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to fetch scholarships", error: err.message });
  }
};

const getTopScholarships = async (req, res) => {
  try {
    const result = await Scholarship.find()
      .sort({ applicationFees: 1, scholarshipPostDate: -1 })
      .limit(6);
    res.send(result);
  } catch (err) {
    res.status(500).send({
      message: "Failed to fetch top scholarships",
      error: err.message,
    });
  }
};

const getScholarshipById = async (req, res) => {
  try {
    const result = await Scholarship.findById(req.params.id);
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to fetch scholarship", error: err.message });
  }
};

const addScholarship = async (req, res) => {
  try {
    const scholarship = new Scholarship(req.body);
    const result = await scholarship.save();
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to add scholarship", error: err.message });
  }
};

const updateScholarship = async (req, res) => {
  try {
    const result = await Scholarship.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to update scholarship", error: err.message });
  }
};

const deleteScholarship = async (req, res) => {
  try {
    const result = await Scholarship.findByIdAndDelete(req.params.id);
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to delete scholarship", error: err.message });
  }
};

module.exports = {
  getAllScholarships,
  getTopScholarships,
  getScholarshipById,
  addScholarship,
  updateScholarship,
  deleteScholarship,
};
