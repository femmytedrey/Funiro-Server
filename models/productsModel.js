const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    additionalDescription: {
      type: String,
    },
    originalPrice: {
      type: Number,
    },
    images: {
      type: [String],
      required: true,
    },
    additionalImages: {
      type: [String],
    },
    size: {
      type: String,
    },
    tags: {
      type: [String],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    promoPercentage: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
