const express = require("express");
const router = express.Router();
const {
  getCart,
  addCart,
  updateCart,
  deleteCart,
} = require("../controllers/cartController");

//get current user's carts
router.get("/", getCart);

router.post("/", addCart);

//patch request
router.patch("/:productId", updateCart);
//delete request
router.delete("/:productId", deleteCart);

module.exports = router;
