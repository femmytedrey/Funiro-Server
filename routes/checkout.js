const express = require("express");
const router = express.Router();
const {
  getCheckouts,
  createCheckout,
  createSession,
  getSession,
  getCheckout,
  deleteCheckout,
  updateCheckout,
} = require("../controllers/checkoutController");

router.get("/", getCheckouts);

router.post("/", createCheckout);

//create payment integration with stripe
router.post("/create-checkout-session", createSession);

//get session
router.get("/session/:sessionId", getSession);

//get single checkout
router.get("/:checkoutId", getCheckout);

//delete checkout
router.delete("/:checkoutId", deleteCheckout);

router.patch("/:checkoutId", updateCheckout);

module.exports = router;
