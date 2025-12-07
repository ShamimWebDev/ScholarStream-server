const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
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
connectDB();

const db = client.db("scholarStream");
const usersCollection = db.collection("users");
const scholarshipsCollection = db.collection("scholarships");
const applicationsCollection = db.collection("applications");
const reviewsCollection = db.collection("reviews");

// -------------------- AUTH MIDDLEWARE --------------------
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send({ message: "Unauthorized access" });

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.decoded = decodedToken;
    next();
  } catch (err) {
    res.status(401).send({ message: "Unauthorized access" });
  }
};

// -------------------- ROLE-BASED MIDDLEWARE --------------------
const verifyAdmin = async (req, res, next) => {
  try {
    const email = req.decoded.email;
    const user = await usersCollection.findOne({ email });
    if (user?.role !== "admin") return res.status(403).send({ message: "Forbidden access" });
    next();
  } catch (err) {
    res.status(500).send({ message: "Server error", error: err });
  }
};

const verifyModerator = async (req, res, next) => {
  try {
    const email = req.decoded.email;
    const user = await usersCollection.findOne({ email });
    if (user?.role !== "moderator" && user?.role !== "admin")
      return res.status(403).send({ message: "Forbidden access" });
    next();
  } catch (err) {
    res.status(500).send({ message: "Server error", error: err });
  }
};

// -------------------- TEST ROUTE --------------------
app.get("/", (req, res) => {
  res.send("ScholarStream Server is Running");
});

// -------------------- USER ROUTES --------------------

// Create User
app.post("/users", async (req, res) => {
  try {
    const user = req.body;
    const existingUser = await usersCollection.findOne({ email: user.email });
    if (existingUser) return res.send({ message: "User already exists", insertedId: null });

    const newUser = { ...user, role: user.role || "student" };
    const result = await usersCollection.insertOne(newUser);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to save user", error: err });
  }
});

// Get User Role
app.get("/users/role/:email", verifyToken, async (req, res) => {
  try {
    const email = req.params.email;
    if (email !== req.decoded.email) return res.status(403).send({ message: "Forbidden access" });

    const user = await usersCollection.findOne({ email });
    res.send({ role: user?.role || "student" });
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch role", error: err });
  }
});

// -------------------- ADMIN USER MANAGEMENT --------------------

// Get All Users (with optional role filter)
app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const filter = req.query.role ? { role: req.query.role } : {};
    const result = await usersCollection.find(filter).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch users", error: err });
  }
});

// Update User Role
app.patch('/users/role/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const role = req.body.role;
    const filter = { _id: new ObjectId(id) };
    const updatedDoc = { $set: { role } };
    const result = await usersCollection.updateOne(filter, updatedDoc);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to update user role", error: err });
  }
});

// Delete User
app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await usersCollection.deleteOne(query);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to delete user", error: err });
  }
});

// -------------------- SCHOLARSHIP ROUTES --------------------

// Add Scholarship (Admin)
app.post("/scholarship", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const scholarship = req.body;
    scholarship.applicationFees = parseFloat(scholarship.applicationFees);
    scholarship.serviceCharge = parseFloat(scholarship.serviceCharge);
    scholarship.scholarshipPostDate = new Date();
    const result = await scholarshipsCollection.insertOne(scholarship);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to add scholarship", error: err });
  }
});

// Update Scholarship
app.patch("/scholarship/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const item = req.body;
    if (item.applicationFees) item.applicationFees = parseFloat(item.applicationFees);
    if (item.serviceCharge) item.serviceCharge = parseFloat(item.serviceCharge);

    const result = await scholarshipsCollection.updateOne({ _id: new ObjectId(id) }, { $set: item });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to update scholarship", error: err });
  }
});

// Delete Scholarship
app.delete("/scholarship/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await scholarshipsCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to delete scholarship", error: err });
  }
});

// Get All Scholarships
app.get("/all-scholarships", async (req, res) => {
  try {
    const search = req.query.search || "";
    const filterCategory = req.query.category || "";
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
    if (filterCategory) query.scholarshipCategory = filterCategory;

    let options = {};
    if (sortFees) options.sort = { applicationFees: sortFees === "asc" ? 1 : -1 };
    else if (sortDate === "newest") options.sort = { scholarshipPostDate: -1 };

    const scholarships = await scholarshipsCollection.find(query, options).skip(skip).limit(limit).toArray();
    const totalScholarships = await scholarshipsCollection.countDocuments(query);

    res.send({ scholarships, totalScholarships });
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch scholarships", error: err });
  }
});

// Get Top 6 Scholarships
app.get("/top-scholarships", async (req, res) => {
  try {
    const result = await scholarshipsCollection.find().sort({ applicationFees: 1, scholarshipPostDate: -1 }).limit(6).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch top scholarships", error: err });
  }
});

// Get Single Scholarship
app.get("/scholarship/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await scholarshipsCollection.findOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch scholarship", error: err });
  }
});

// -------------------- PAYMENT ROUTES --------------------
app.post("/create-payment-intent", verifyToken, async (req, res) => {
  try {
    const { price } = req.body;
    const amount = parseInt(price * 100);
    if (!price || amount < 1) return res.send({ clientSecret: null });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).send({ message: "Failed to create payment intent", error: err });
  }
});

// -------------------- APPLICATION ROUTES --------------------
app.post("/applications", verifyToken, async (req, res) => {
  try {
    const application = req.body;
    application.applicationDate = new Date();
    application.applicationFees = parseFloat(application.applicationFees);
    application.serviceCharge = parseFloat(application.serviceCharge);
    const result = await applicationsCollection.insertOne(application);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to save application", error: err });
  }
});

// Get Applications by User
app.get("/applications/:email", verifyToken, async (req, res) => {
  try {
    const email = req.params.email;
    if (email !== req.decoded.email) return res.status(403).send({ message: "Forbidden access" });

    const result = await applicationsCollection.find({ userEmail: email }).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch applications", error: err });
  }
});

// Moderator/Admin: Get All Applications
app.get("/all-applications", verifyToken, verifyModerator, async (req, res) => {
  try {
    const result = await applicationsCollection.find().toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch applications", error: err });
  }
});

// Moderator: Add Feedback & Update Status
app.patch("/application/feedback/:id", verifyToken, verifyModerator, async (req, res) => {
  try {
    const id = req.params.id;
    const { status, feedback } = req.body;
    const updateDoc = { $set: { applicationStatus: status } };
    if (feedback) updateDoc.$set.feedback = feedback;

    const result = await applicationsCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to update application", error: err });
  }
});

// Student: Edit Application (Pending only)
app.patch("/application/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const updateData = req.body;
  const filter = { _id: new ObjectId(id), userEmail: req.decoded.email, applicationStatus: "pending" };
  const result = await applicationsCollection.updateOne(filter, { $set: updateData });
  res.send(result);
});

// Student: Delete Application (Pending only)
app.delete("/application/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id), userEmail: req.decoded.email, applicationStatus: "pending" };
  const result = await applicationsCollection.deleteOne(query);
  res.send(result);
});

// -------------------- REVIEWS ROUTES --------------------
app.post("/reviews", verifyToken, async (req, res) => {
  const review = req.body;
  review.reviewDate = new Date();
  review.ratingPoint = parseInt(review.ratingPoint);
  const result = await reviewsCollection.insertOne(review);
  res.send(result);
});

app.patch("/reviews/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const { ratingPoint, reviewComment } = req.body;
  const filter = { _id: new ObjectId(id), userEmail: req.decoded.email };
  const updatedDoc = { $set: { ratingPoint: parseInt(ratingPoint), reviewComment, reviewDate: new Date() } };
  const result = await reviewsCollection.updateOne(filter, updatedDoc);
  res.send(result);
});

app.get("/reviews/:scholarshipId", async (req, res) => {
  const id = req.params.scholarshipId;
  const query = { scholarshipId: id };
  const result = await reviewsCollection.find(query).toArray();
  res.send(result);
});

app.get("/reviews-by-user/:email", verifyToken, async (req, res) => {
  const email = req.params.email;
  if (email !== req.decoded.email) return res.status(403).send({ message: "Forbidden access" });
  const query = { userEmail: email };
  const result = await reviewsCollection.find(query).toArray();
  res.send(result);
});

app.delete("/reviews/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const result = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

// -------------------- ANALYTICS --------------------
app.get("/admin-stats", verifyToken, verifyAdmin, async (req, res) => {
  const users = await usersCollection.estimatedDocumentCount();
  const scholarships = await scholarshipsCollection.estimatedDocumentCount();
  const applications = await applicationsCollection.estimatedDocumentCount();

  const payments = await applicationsCollection.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $group: { _id: null, totalRevenue: { $sum: "$applicationFees" } } }
  ]).toArray();

  const revenue = payments.length > 0 ? payments[0].totalRevenue : 0;

  res.send({ users, scholarships, applications, revenue });
});

app.get("/analytics-chart", verifyToken, verifyAdmin, async (req, res) => {
  const result = await applicationsCollection.aggregate([
    { $group: { _id: "$scholarshipCategory", count: { $sum: 1 } } }
  ]).toArray();
  res.send(result);
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
