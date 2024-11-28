const User = require("../models/usersModel");

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

module.exports = {
  storeUser,
  updateUser,
  getUser,
};
