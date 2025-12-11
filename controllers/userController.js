const User = require("../models/User");

const addUser = async (req, res) => {
  try {
    const user = req.body;
    // Case-insensitive check for existing user
    const existingUser = await User.findOne({
      email: { $regex: new RegExp(`^${user.email}$`, "i") },
    });
    if (existingUser)
      return res.send({ message: "user already exists", insertedId: null });

    const newUser = new User(user);
    const result = await newUser.save();
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to save user", error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const filter = req.query.role ? { role: req.query.role } : {};
    const result = await User.find(filter);
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to fetch users", error: err.message });
  }
};

const getUserByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    if (email !== req.decoded.email)
      return res.status(403).send({ message: "forbidden access" });

    // Case-insensitive email search
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send(user);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to fetch user", error: err.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const id = req.params.id;
    const role = req.body.role;
    const result = await User.findByIdAndUpdate(id, { role }, { new: true });
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to update role", error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await User.findByIdAndDelete(id);
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to delete user", error: err.message });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const { email, scholarshipId } = req.body;
    if (email !== req.decoded.email)
      return res.status(403).send({ message: "forbidden access" });

    const result = await User.updateOne(
      { email: { $regex: new RegExp(`^${email}$`, "i") } },
      { $addToSet: { wishlist: scholarshipId } }
    );
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to add to wishlist", error: err });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { email, scholarshipId } = req.body;
    if (email !== req.decoded.email)
      return res.status(403).send({ message: "forbidden access" });

    const result = await User.updateOne(
      { email: { $regex: new RegExp(`^${email}$`, "i") } },
      { $pull: { wishlist: scholarshipId } }
    );
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to remove from wishlist", error: err });
  }
};

const getWishlist = async (req, res) => {
  try {
    const email = req.params.email;
    if (email !== req.decoded.email)
      return res.status(403).send({ message: "forbidden access" });

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    }).populate("wishlist");

    if (!user) return res.status(404).send({ message: "User not found" });

    const validWishlist = user.wishlist.filter((item) => item !== null);

    res.send(validWishlist);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch wishlist", error: err });
  }
};

module.exports = {
  addUser,
  getAllUsers,
  getUserByEmail,
  updateUserRole,
  deleteUser,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
};
