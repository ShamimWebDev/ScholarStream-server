const Application = require("../models/Application");

const saveApplication = async (req, res) => {
  try {
    const appData = req.body;
    const newApplication = new Application(appData);
    const result = await newApplication.save();
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to save application", error: err.message });
  }
};

const getApplicationsByUser = async (req, res) => {
  try {
    const email = req.params.email;
    if (email !== req.decoded.email)
      return res.status(403).send({ message: "forbidden access" });
    const result = await Application.find({ userEmail: email });
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to fetch applications", error: err.message });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).send({ message: "Application not found" });
    }
    res.send(application);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to fetch application", error: err.message });
  }
};

const getAllApplications = async (req, res) => {
  try {
    const result = await Application.find();
    res.send(result);
  } catch (err) {
    res.status(500).send({
      message: "Failed to fetch all applications",
      error: err.message,
    });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const updateDoc = { applicationStatus: status };
    if (feedback) updateDoc.feedback = feedback;

    const result = await Application.findByIdAndUpdate(
      req.params.id,
      updateDoc,
      { new: true }
    );
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to update status", error: err.message });
  }
};

const editApplication = async (req, res) => {
  try {
    // Allow payment status updates even if not pending
    const filter = {
      _id: req.params.id,
      userEmail: req.decoded.email,
    };

    // Only enforce pending status if NOT updating payment status
    if (!req.body.paymentStatus) {
      filter.applicationStatus = "pending";
    }

    const result = await Application.findOneAndUpdate(filter, req.body, {
      new: true,
    });
    if (!result)
      return res
        .status(404)
        .send({ message: "Application not found or not editable" });
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to edit application", error: err.message });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const filter = {
      _id: req.params.id,
      userEmail: req.decoded.email,
      applicationStatus: "pending",
    };
    const result = await Application.findOneAndDelete(filter);
    if (!result)
      return res
        .status(404)
        .send({ message: "Application not found or not deletable" });
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to delete application", error: err.message });
  }
};

module.exports = {
  saveApplication,
  getApplicationsByUser,
  getApplicationById,
  getAllApplications,
  updateApplicationStatus,
  editApplication,
  deleteApplication,
};
