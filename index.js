const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken'); 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin'); // Firebase Admin SDK

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- FIREBASE ADMIN INITIALIZATION ---
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountBase64) {
    console.error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
    process.exit(1);
}
const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log("Firebase Admin Initialized successfully!");

app.get('/', (req, res) => {
  res.send('ScholarStream Server Initialized.');
});

app.use((req, res, next) => {
    res.status(404).send({ message: "404 Not Found" });
});

app.listen(port, () => {
  console.log(`ScholarStream server running on port ${port}`);
});
