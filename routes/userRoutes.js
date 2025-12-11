const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");

router.post("/", userController.addUser);
router.get("/", verifyToken, verifyAdmin, userController.getAllUsers);
router.get("/:email", verifyToken, userController.getUserByEmail);
router.patch(
  "/role/:id",
  verifyToken,
  verifyAdmin,
  userController.updateUserRole
);
router.delete("/:id", verifyToken, verifyAdmin, userController.deleteUser);
router.put("/wishlist/add", verifyToken, userController.addToWishlist);
router.put("/wishlist/remove", verifyToken, userController.removeFromWishlist);
router.get("/wishlist/:email", verifyToken, userController.getWishlist);

module.exports = router;
