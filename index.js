const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const admin = require("firebase-admin"); // Firebase Admin SDK

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Firebase Admin Initialization
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountBase64) {
  console.error("FIREBASE_SERVICE_ACCOUNT env var not set.");
  process.exit(1);
}
const serviceAccount = JSON.parse(
  Buffer.from(serviceAccountBase64, "base64").toString("utf-8")
);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// MongoDB Connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.example.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // DB COLLECTIONS
    const db = client.db("scholarStream");
    const usersCollection = db.collection("users");
    const scholarshipsCollection = db.collection("scholarships");
    const applicationsCollection = db.collection("applications");
    const reviewsCollection = db.collection("reviews");

    console.log("Pinged your deployment. Connected to MongoDB!");

   
    app.get("/", (req, res) => {
      res.send("ScholarStream Server is Running");
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB or run server logic:", error);
  }
}
run().catch(console.dir);



// 404 Handler

app.use((req, res, next) => {
  res.status(404).send({ message: "404 Not Found" });
});

app.listen(port, () => {
  console.log(`ScholarStream server running on port ${port}`);
});
