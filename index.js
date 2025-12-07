// server.js
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const admin = require("firebase-admin");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 5000;

// -------------------- MIDDLEWARE --------------------
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
  serviceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, "base64").toString("utf-8")
  );
} catch (err) {
  console.error("Invalid FIREBASE_SERVICE_ACCOUNT JSON:", err);
  process.exit(1);
}

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

async function connectDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
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

// -------------------- ROLE-BASED MIDDLEWARE --------------------
const verifyAdmin = async (req, res, next) => {
  try {
    const email = req.decoded.email;
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ email });
    if (user?.role !== "admin") {
      return res.status(403).send({ message: "forbidden access" });
    }
    next();
  } catch (err) {
    res.status(500).send({ message: "Server error", error: err });
  }
};

const verifyModerator = async (req, res, next) => {
  try {
    const email = req.decoded.email;
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ email });
    if (user?.role !== "moderator" && user?.role !== "admin") {
      return res.status(403).send({ message: "forbidden access" });
    }
    next();
  } catch (err) {
    res.status(500).send({ message: "Server error", error: err });
  }
};

// -------------------- ROUTES --------------------

// Test route
app.get("/", (req, res) => {
  res.send("ScholarStream Server is Running");
});

// -------------------- USER ROUTES --------------------

// Save or Update User (Social Login logic - default role: 'student')
app.post("/users", async (req, res) => {
  try {
    const usersCollection = db.collection("users");
    const user = req.body;
    const query = { email: user.email };
    const existingUser = await usersCollection.findOne(query);

    if (existingUser) {
      return res.send({ message: "user already exists", insertedId: null });
    }

    const newUser = { ...user, role: user.role || "student" };
    const result = await usersCollection.insertOne(newUser);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to save user", error: err });
  }
});

// Get User Role (For client-side dashboard routing protection)
app.get("/users/role/:email", verifyToken, async (req, res) => {
  try {
    const email = req.params.email;
    if (email !== req.decoded.email) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ email });
    const role = user?.role || "student";
    res.send({ role });
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch role", error: err });
  }
});



// -------------------- 404 HANDLER --------------------
app.use((req, res) => {
  res.status(404).send({ message: "404 Not Found" });
});

// -------------------- GRACEFUL SHUTDOWN --------------------
process.on("SIGINT", async () => {
  await client.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});

// -------------------- START SERVER --------------------
app.listen(port, () => {
  console.log(`ScholarStream server running on port ${port}`);
});
