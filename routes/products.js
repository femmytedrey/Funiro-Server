const express = require("express");
const router = express.Router();
const {
  allProducts,
  singleProduct,
  createProduct,
  updateProduct,
} = require("../controllers/productController");
const Product = require("../models/productsModel");

//fetch all products
router.get("/", allProducts);

//search for product
router.get("/search", async (req, res) => {
  try {
    const keyword = req.query.q;
    if (!keyword) {
      return res.status(400).json({ message: "Keyword is required" });
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { additionalDescription: { $regex: keyword, $options: "i" } },
        { tags: { $regex: keyword, $options: "i" } },
        { category: { $regex: keyword, $options: "i" } },
      ],
    });

    // if (products.length === 0) {
    //   res
    //     .status(404)
    //     .json({ message: "No products match your search criteria." });
    // }

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//fetch single product'
router.get("/:id", singleProduct);

//create product
router.post("/", createProduct);

//put request
router.put("/:id", updateProduct);

module.exports = router;
