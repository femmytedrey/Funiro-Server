const express = require("express");
const {
  storeUser,
  updateUser,
  getUsers,
  getUser,
  deleteUser,
  toggleAdminRole,
} = require("../controllers/userController");
const router = express.Router();

router.get("/", getUsers);

router.post("/store-user", storeUser);

// Route to update user session after login
router.post("/update-user", updateUser);

//get a user
router.get("/get-user/:id", getUser);

//delete a user
router.delete("/delete-user/:uid", deleteUser);

//toggle admin role
router.patch("/toggle-admin", toggleAdminRole);

module.exports = router;
