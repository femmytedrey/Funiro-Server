const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartItemSchema = new Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    user: {
      type: String,
      ref: "User",
      required: true,
    },
    items: [cartItemSchema],
    total: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },
  },
  { timestamps: true }
);

cartSchema.pre("save", function (next) {
  this.total = this.items.reduce((total, item) => {
    return total + item.quantity * item.price;
  }, 0);
  next();
});

module.exports = mongoose.model("Cart", cartSchema);
