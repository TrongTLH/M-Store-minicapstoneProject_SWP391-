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
  saveAddress,
  userCart,
  getUserCart,
  emptyCart,
  applyCoupon,
  createOrder,
  getOrders,
  updateOrderStatus,
  
  } = require("../controllers/userController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();
router.post("/register", createUser);
router.post("/forgot-password-token", forgotPasswordToken );
router.put("/reset-password/:token", resetPassword );


router.put("/password",authMiddleware ,updatePassword);
router.post("/login", loginUserController );

router.post("/admin-login", loginAdminController );
router.post("/cart", authMiddleware, userCart);
router.post("/cart/apllycoupon", authMiddleware, applyCoupon);
router.post("/cart/cash-order", authMiddleware, createOrder);

router.get("/all-users", getallUser);
router.get("/get-orders", authMiddleware, getOrders);
router.get("/refresh", handlerfreshToken);
router.get("/logout", logout);

router.get("/wishlist", authMiddleware, getWishlist);
router.get("/cart", authMiddleware, getUserCart);
router.get("/:id", authMiddleware,isAdmin ,getaUser);

router.delete("/empty-cart", authMiddleware, emptyCart);
router.delete("/:id", deleteaUser);
router.put("/order/update_order/:id", authMiddleware, isAdmin, updateOrderStatus);

router.put("/edit-user",authMiddleware , updatedUser);
router.put("/save-address",authMiddleware , saveAddress);
router.put("/block-user/:id",authMiddleware ,isAdmin , blockUser);
router.put("/unblock-user/:id",authMiddleware ,isAdmin , unblockUser);


module.exports = router;