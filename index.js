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

app.get('/', (req, res) => {
  res.send('ScholarStream Server Initialized.');
});

app.use((req, res, next) => {
    res.status(404).send({ message: "404 Not Found" });
});

app.listen(port, () => {
  console.log(`ScholarStream server running on port ${port}`);
});
