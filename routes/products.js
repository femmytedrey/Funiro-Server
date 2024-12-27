const express = require("express");
const router = express.Router();
const {
  allProducts,
  singleProduct,
  createProduct,
  updateProduct,
  searchProduct,
  deleteProduct,
} = require("../controllers/productController");

//fetch all products
router.get("/", allProducts);

//search for product
router.get("/search", searchProduct);

//fetch single product'
router.get("/:id", singleProduct);

//create product
router.post("/", createProduct);

//put request
router.put("/:id", updateProduct);

//delete request
router.delete("/:id", deleteProduct);

module.exports = router;
