const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const checkoutSchema = new Schema({
  user: {
    type: String,
    required: true,
  },
  cart: {
    type: Schema.Types.ObjectId,
    ref: "Cart",
    required: true,
  },
  deliveryDetails: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    shippingAddress: {
      type: String,
      required: true,
    },
    phone: { type: String, required: true },
    companyName: { type: String },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true },
    additionalInformation: { type: String },
  },

  paymentMethod: {
    type: String,
    enum: ["cashOnDelivery", "card"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const Checkout = mongoose.model("Checkout", checkoutSchema);

module.exports = Checkout;
