const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    // Construct the URI using backticks for string interpolation
    // Using 'scholarstream' as the database name
    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.ucsbh54.mongodb.net/scholarstream?appName=Cluster1`;

    await mongoose.connect(uri);

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
