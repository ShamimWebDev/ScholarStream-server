const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post(
  "/create-payment-intent",
  verifyToken,
  paymentController.createPaymentIntent
);

module.exports = router;
