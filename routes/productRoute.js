const express = require("express");
const { 
  createProduct, 
  getaProduct, 
  getAllProduct, 
  updateProduct,
  deleteProduct,
  addToWishList,
  rating, 
} = require("../controllers/productController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
isAdmin
const router = express.Router();


router.post("/", authMiddleware, isAdmin, createProduct);
router.get("/:id", getaProduct);
router.put("/wishlist", authMiddleware, addToWishList);
router.put("/rating", authMiddleware, rating);

router.put("/:id", authMiddleware, isAdmin, updateProduct);
router.delete("/:id", authMiddleware, isAdmin, deleteProduct);
router.get("/", getAllProduct);



module.exports = router;