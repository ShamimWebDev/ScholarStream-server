const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (req, res) => {
  try {
    const { price } = req.body;
    if (!price || isNaN(price) || price <= 0)
      return res.send({ clientSecret: null });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(price * 100),
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res
      .status(500)
      .send({ message: "Payment intent failed", error: err.message });
  }
};

module.exports = { createPaymentIntent };
