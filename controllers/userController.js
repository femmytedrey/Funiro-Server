const User = require("../models/usersModel");
const admin = require('firebase-admin');

const getUsers = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token is required" });
    }

    const idToken = authorization.split(" ")[1];

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const user = await User.findOne({ uid: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found in database" });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getUsers:", error.message);
    res.status(500).json({ error: "Unable to fetch users" });
  }
};

const storeUser = async (req, res) => {
  const { uid, email } = req.user;
  const { firstName, lastName } = req.body;

  if (!firstName || !lastName) {
    return res
      .status(400)
      .json({ error: "firstName and lastName are required" });
  }

  try {
    let user = await User.findOne({ uid });

    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    user = new User({ uid, email, firstName, lastName });
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Unable to create user", details: error.message });
  }
};

const updateUser = async (req, res) => {
  const { uid, email } = req.user;

  try {
    let user = await User.findOne({ uid });
    if (!user) {
      user = new User({ uid, email });
      await user.save();
    }

    res.status(200).json(user);
    ``;
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating user session", details: error.message });
  }
};

const getUser = async (req, res) => {
  const uid = req.params.id;
  try {
    let user = await User.findOne({ uid });
    if (!user) {
      console.log("response in not user not successful");
      return res
        .status(404)
        .json({ error: "No user found", details: error.message });
    }

    if (user) {
      console.log("response successful");
    }
    res.status(200).json(user);
  } catch (error) {
    console.log("response in catch not successful");
    res
      .status(500)
      .json({ error: "Error getting user", details: error.message });
  }
};

const deleteUser = async (req, res) => {
  const {uid} = req.params;
  try {
    await admin.auth().deleteUser(uid);
    const deletedUser = await User.findOneAndDelete({ uid });
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  }catch (error) {
    res.status(500).json({ error: "Error deleting user" });
  }
}  

const toggleAdminRole = async (req, res) => {
  const { uid } = req.body; // UID of the user whose role is being toggled
  const { authorization } = req.headers;

  try {
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token is required" });
    }

    const idToken = authorization.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const requesterId = decodedToken.uid;

    // Ensure requester is an admin
    const requester = await User.findOne({ uid: requesterId });
    if (!requester || !requester.isAdmin) {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    // Find the target user
    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Toggle admin status
    user.isAdmin = !user.isAdmin;
    await user.save();

    // Optionally update Firebase custom claims
    await admin.auth().setCustomUserClaims(uid, { isAdmin: user.isAdmin });

    res.status(200).json({ message: "Admin role toggled successfully", user });
  } catch (error) {
    console.error("Error in toggleAdminRole:", error.message);
    res.status(500).json({ error: "Unable to toggle admin role" });
  }
};



module.exports = {
  storeUser,
  updateUser,
  getUsers,
  getUser,
  deleteUser,
  toggleAdminRole,
};
