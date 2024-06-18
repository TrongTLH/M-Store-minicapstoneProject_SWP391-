const express = require("express");
const { 
  createUser, 
  loginUserController, 
  getallUser,
  getaUser, 
  deleteaUser, 
  updatedUser, 
  blockUser,
  unblockUser,
  handlerfreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  loginAdminController,
  getWishlist,
  } = require("../controllers/userController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();
router.post("/register", createUser);
router.post("/forgot-password-token", forgotPasswordToken );
router.put("/reset-password/:token", resetPassword );

router.put("/password",authMiddleware ,updatePassword);
router.post("/login", loginUserController );
router.post("/admin-login", loginAdminController );
router.get("/all-users", getallUser);
router.get("/refresh", handlerfreshToken);
router.get("/logout", logout);

router.get("/wishlist", authMiddleware, getWishlist);
router.get("/:id", authMiddleware,isAdmin ,getaUser);


router.delete("/:id", deleteaUser);

router.put("/edit-user",authMiddleware , updatedUser);
router.put("/block-user/:id",authMiddleware ,isAdmin , blockUser);
router.put("/unblock-user/:id",authMiddleware ,isAdmin , unblockUser);


module.exports = router;