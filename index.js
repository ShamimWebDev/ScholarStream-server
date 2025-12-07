// Import dependencies
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const admin = require("firebase-admin");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 5000;

// -------------------- MIDDLEWARE --------------------
// Enable CORS and parse JSON bodies
app.use(cors());
app.use(express.json());

// -------------------- FIREBASE ADMIN INIT --------------------
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountBase64) {
  console.error("FIREBASE_SERVICE_ACCOUNT env var not set.");
  process.exit(1);
}

let serviceAccount;
try {
  // Decode base64 and parse JSON
  serviceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, "base64").toString("utf-8")
  );
} catch (err) {
  console.error("Invalid FIREBASE_SERVICE_ACCOUNT JSON:", err);
  process.exit(1);
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// -------------------- MONGODB CONNECTION --------------------
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lwmsv9d.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1); // Stop server if DB fails
  }
}

// Call DB connection
connectDB();

// Store DB in app.locals for route access
const db = client.db("scholarStream");
app.locals.db = db;

// -------------------- AUTH MIDDLEWARE --------------------
// Verify Firebase token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).send({ message: "Unauthorized access" });

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.decoded = decodedToken; // store decoded token in request
    next();
  } catch (err) {
    res.status(401).send({ message: "Unauthorized access" });
  }
};

// -------------------- ROUTES --------------------










// -------------------- 404 HANDLER --------------------
app.use((req, res) => {
  res.status(404).send({ message: "404 Not Found" });
});

// --------------------  SHUTDOWN --------------------
process.on("SIGINT", async () => {
  await client.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});

// -------------------- START SERVER --------------------
app.listen(port, () => {
  console.log(`ScholarStream server running on port ${port}`);
});
