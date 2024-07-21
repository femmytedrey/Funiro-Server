const express = require("express");
const {
  storeUser,
  updateUser,
  getUser,
} = require("../controllers/userController");
const router = express.Router();

router.post("/store-user", storeUser);

// Route to update user session after login
router.post("/update-user", updateUser);

//get a user
router.get("/get-user/:id", getUser);

module.exports = router;
