const jwt = require("jsonwebtoken");
const User = require("../models/User");

// JWT Authentication Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

// Admin verification middleware
const verifyAdmin = async (req, res, next) => {
  try {
    const email = req.decoded.email;
    const user = await User.findOne({ email: email });

    // Check for both lowercase and capitalized "admin" role
    const isAdmin = user?.role?.toLowerCase() === "admin";

    if (!isAdmin) {
      return res.status(403).send({ message: "forbidden access" });
    }

    next();
  } catch (error) {
    return res
      .status(500)
      .send({ message: "error verifying admin status", error: error.message });
  }
};

// Moderator verification middleware
const verifyModerator = async (req, res, next) => {
  try {
    const email = req.decoded.email;
    const user = await User.findOne({ email: email });

    // Check for both lowercase and capitalized roles
    const userRole = user?.role?.toLowerCase();
    const isModerator = userRole === "moderator" || userRole === "admin";

    if (!isModerator) {
      return res.status(403).send({ message: "forbidden access" });
    }

    next();
  } catch (error) {
    return res
      .status(500)
      .send({
        message: "error verifying moderator status",
        error: error.message,
      });
  }
};

module.exports = { verifyToken, verifyAdmin, verifyModerator };
