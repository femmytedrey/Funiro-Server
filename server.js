const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");
const checkoutRoutes = require("./routes/checkout");
const cartRoutes = require("./routes/carts");
const admin = require("./firebaseSetup");

//used in the webhook
const Checkout = require("./models/CheckoutModel");
const Cart = require("./models/cartModel");
const { getAdminCheckouts } = require("./controllers/checkoutController");

dotenv.config();

const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Configure CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

//checkout webhook
app.post(
  "/api/checkout/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      console.log("Webhook received");
      const sig = req.headers["stripe-signature"];
      let event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_KEY
      );
      console.log("Event verified:", event.type);

      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object;
          const { checkoutId, userId } = session.metadata;
          const checkout = await Checkout.findById(checkoutId);
          await Cart.findByIdAndUpdate(checkout.cart, {
            status: "archived",
          });
          checkout.paymentStatus = "completed";
          await checkout.save();
          const newCart = new Cart({
            user: userId,
            items: [],
            status: "active",
          });
          await newCart.save();
          break;

        case "checkout.session.async_payment_failed":
          const failedSession = event.data.object;
          const failedCheckoutId = failedSession.metadata.checkoutId;

          //update checkout status to failed
          const failedCheckout = await Checkout.findById(failedCheckoutId);
          failedCheckout.paymentStatus = "failed";
          await failedCheckout.save();
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
          break;
      }
      res.status(200).json({ message: "Webhook received" });
    } catch (error) {
      console.error("Stripe webhook error:", error, error?.message);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

const verifyFirebaseToken = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "Authorization is required" });
  }

  const token = authorization.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    res.status(401).json({ error: "Authorization failed" });
  }
};

app.use("/api/users", verifyFirebaseToken, userRoutes);

// ecommerce product data route
app.use("/api/products", productRoutes);

//cart endpoints
app.use("/api/carts", verifyFirebaseToken, cartRoutes);

//checkout endpoints
app.get("/api/admin/checkouts", verifyFirebaseToken, getAdminCheckouts);
app.use("/api/checkouts", verifyFirebaseToken, checkoutRoutes);

// Connect to the database and start the server
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });
