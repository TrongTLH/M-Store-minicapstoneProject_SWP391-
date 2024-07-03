const { generateToken } = require("../config/jwtToken");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const uniqid = require('uniqid'); 
const asyncHandler = require("express-async-handler");
const validate = require("../utils/validate");
const { generateRefreshToken } = require("../config/refreshtoken");
const jwt = require("jsonwebtoken");
const validateMongoDbId = require("../utils/validateMongodbId");
const sendEmail = require("./emailController");
const crypto = require("crypto");
const { log } = require("console");


const createUser = asyncHandler(async (req, res) => {
  const email = req.body.email;
  const findUser = await User.findOne({email: email});
  if (!findUser) {
    //create a new user
    const newUser = await User.create(req.body);
    res.json(newUser);
  }else{
    throw new Error('User Already Exists');
  }
});

//login
const loginUserController = asyncHandler (async(req, res) => {
  const { email, password} = req.body;
  //check if user exists or not
  const findUser = await User.findOne({ email });
  if(findUser && await findUser.isPasswordMatched(password)){
    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateuser = await User.findByIdAndUpdate(findUser.id, {
      refreshToken:refreshToken,
    },
    {new:true}
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly:true,
      maxAge:72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findUser?._id,
      firstname:findUser?.firstname,
      lastname: findUser?.lastname,
      email: findUser?.email,
      mobile: findUser?.mobile,
      token: generateToken(findUser?._id),
    });
  }else{
    throw new Error("Invalid Credentials");
  }
});

//login admin
const loginAdminController = asyncHandler (async(req, res) => {
  const { email, password} = req.body;
  //check if user exists or not
  const findAdmin = await User.findOne({ email });
  if(findAdmin.role !== "admin") throw new Error("Not Authorised");
  if(findAdmin && await findAdmin.isPasswordMatched(password)){
    const refreshToken = await generateRefreshToken(findAdmin?._id);
    const updateuser = await User.findByIdAndUpdate(findAdmin.id, {
      refreshToken:refreshToken,
    },
    {new:true}
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly:true,
      maxAge:72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findAdmin?._id,
      firstname:findAdmin?.firstname,
      lastname: findAdmin?.lastname,
      email: findAdmin?.email,
      mobile: findAdmin?.mobile,
      token: generateToken(findAdmin?._id),
    });
  }else{
    throw new Error("Invalid Credentials");
  }
});

//handle refresh token

const handlerfreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if(!cookie?.refreshToken) throw new Error ("No refresh token in cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if(!user) throw new Error (" No refresh token present in db or not matched");
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err || user.id !== decoded.id) {
          throw new Error("There is something wrong with refresh token");
      }
      const accessToken = generateToken(user?._id);
      res.json({ accessToken });
  });
 
});

// logout 

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) {
    throw new Error("No refresh token in cookies");
  }

  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });

  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(204); // No Content
  }

  await User.findOneAndUpdate(
    { _id: user._id },
    { refreshToken: "" }
  );

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });

  res.sendStatus(204); // No Content
});

//Update a User
const updatedUser = asyncHandler(async (req, res) => {
  const{_id} = req.user;
  validate(_id);
  try{
    const updatedUser = await User.findByIdAndUpdate(_id, {
      firstname: req?.body?.firstname,
      lastname: req?.body?.lastname,
      email: req?.body?.email,
      mobile: req?.body?.mobile,
    },
    {
      new: true,
    });
    res.json(updatedUser);
  }catch(error) {
    throw new Error(error);
  }
});

const saveAddress = asyncHandler(async(req, res) => {
  const{_id} = req.user;
  validate(_id);
  try{
    const updatedUser = await User.findByIdAndUpdate(_id, {
      address: req?.body?.address,
    },
    {
      new: true,
    });
    res.json(updatedUser);
  }catch(error) {
    throw new Error(error);
  }
});

//get all users

const getallUser = asyncHandler(async (req, res) => {
  try{
    const getUsers = await User.find();
    res.json(getUsers);
  }catch (error) {
    throw new Error(error);
  }
});

//Get a single user
const getaUser = asyncHandler(async(req, res) => {
  const { id } = req.params;
  validate(id);
  try{
    const getaUser = await User.findById(id);
    res.json({
      getaUser,
    })
  }catch (error) {
    throw new Error(error);
  }
});

//Get a delete user
const deleteaUser = asyncHandler(async(req, res) => {
  const { id } = req.params;
  try{
    const deleteaUser = await User.findByIdAndDelete(id);
    res.json({
      deleteaUser,
    })
  }catch (error) {
    throw new Error(error);
  }
});

const blockUser = asyncHandler(async(req, res) => {
  const { id } = req.params;
  validate(id);
  try {
    const block = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      {
        new: true,
      },
    );
    res.json(block);
  }catch (error) {
    throw new Error(error);
  }
});

const unblockUser = asyncHandler(async(req, res) => {
  const { id } = req.params;
  validate(id);
  try {
    const unblock = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      {
        new: true,
      },
    );
    res.json({
      message: "User UnBlocked",
    });
  }catch (error) {
    throw new Error(error);
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password } = req.body;  // Lấy giá trị mật khẩu từ body
  validateMongoDbId(_id);
  const user = await User.findById(_id);
  
  if (password) {
    user.password = password;
    const updatedPassword = await user.save();
    res.json(updatedPassword);
  } else {
    res.status(400).json({ message: "Password is required" });
  }
});

const forgotPasswordToken = asyncHandler(async ( req, res) =>{
  const {email} = req.body;
  const user = await User.findOne({email});
  if (!user) throw new Error("User not found with this email");
  try{
    const token = await user.createPasswordResetToken();
    await user.save();
    const resetURL = `Hi, please  reset your password. This link is valid still 10 minutes<a href='http://localhost:5000/api/user/reset-password/${token}>click here</>`;
    const data = {
      to:email,
      text:"Hey, user",
      subject: "Forgot Password Link",
      html: resetURL,
    };
    sendEmail(data);
    res.json(token);
  }catch(error) {
    throw new Error(error);
  }
});

const resetPassword = asyncHandler(async(req, res) => {
  const {password} = req.body;
  const { token } =req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {$gt: Date.now()},
  });
  if(!user) throw new Error("Token Expired, please try again later");
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json(user);
});

const getWishlist = asyncHandler(async(req, res) => {
  const { id } = req.user;

  try {
    const findUser = await User.findById(id).populate("wishlist");
    res.json(findUser);
  }catch(error){
    throw new Error(error)
  }
});


const userCart = asyncHandler(async (req, res) => {
  const { cart } = req.body;
  const { _id } = req.user;

  validateMongoDbId(_id);

  try {
    let products = [];
    const user = await User.findById(_id);

    // Tìm giỏ hàng của người dùng nếu đã tồn tại
    let alreadyExistCart = await Cart.findOne({ orderby: user._id });

    if (alreadyExistCart) {
      // Xóa giỏ hàng hiện tại nếu đã tồn tại
      await Cart.deleteOne({ _id: alreadyExistCart._id });
    }

    // Tạo mới danh sách sản phẩm trong giỏ hàng
    for (let i = 0; i < cart.length; i++) {
      let object = {};
      object.product = cart[i]._id;
      object.count = cart[i].count;
      object.color = cart[i].color;

      // Lấy giá của sản phẩm từ cơ sở dữ liệu
      let getPrice = await Product.findById(cart[i]._id).select("price").exec();

      if (getPrice) {
        object.price = getPrice.price;
        products.push(object);
      } else {
        return res.status(400).json({
          success: false,
          message: `Product with id ${cart[i]._id} not found`
        });
      }
    }

    // Tính tổng giá trị giỏ hàng
    let cartTotal = products.reduce((total, item) => total + item.price * item.count, 0);

    // Tạo mới giỏ hàng và lưu vào cơ sở dữ liệu
    const newCart = new Cart({
      products,
      cartTotal,
      orderby: user._id
    });

    await newCart.save();

    res.status(200).json({
      success: true,
      message: "Cart has been updated successfully",
      cart: newCart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

const getUserCart = asyncHandler ( async(req, res) => {
  const {_id} = req.user;
  validateMongoDbId(_id);
  try{
    const cart = await Cart.findOne({ orderby: _id}).populate(
      "products.product"
      );
    res.json(cart);
  }catch(error) {
    throw new Error(error);
  }
});

const emptyCart = asyncHandler (async (req, res) => {
  const {_id} = req.user;
  validateMongoDbId(_id);
  try{
    const user = await User.findOne({_id});
    const cart = await Cart.findOneAndDelete({orderby: user._id});
    res.json(cart);
  }catch(error) {
    throw new Error(error);
  }
});

const applyCoupon = asyncHandler(async (req, res) => {
  const { coupon } = req.body;
  const {_id} = req.user;
  validateMongoDbId(_id);
  const validCoupon = await Coupon.findOne({ name: coupon});
  if (validCoupon === null) {
    throw new Error("Invalid Coupon");
  }
  const user = await User.findOne({ _id });
  let { cartTotal } = await Cart.findOne({ 
    orderby: user._id
  }).populate("products.product");
    let totalAfterDiscount = (
      cartTotal - (cartTotal * validCoupon.discount)/100).toFixed(2);
    await Cart.findOneAndUpdate(
      {orderby: user._id}, 
      {totalAfterDiscount}, 
      {new: true}
      );
      res.json(totalAfterDiscount);
  });

  const createOrder = asyncHandler(async (req, res) => {
    const { COD, couponApplied } = req.body;
    const { _id } = req.user;
    validateMongoDbId(_id);
  
    try {
      if (!COD) throw new Error("Create cash order failed");
  
      const user = await User.findById(_id);
      let userCart = await Cart.findOne({ orderby: user._id });
  
      if (!userCart) {
        throw new Error("User cart not found");
      }
  
      let finalAmount = 0;
  
      if (couponApplied && userCart.totalAfterDiscount) {
        finalAmount = userCart.totalAfterDiscount;
      } else {
        finalAmount = userCart.cartTotal;
      }
  
      let newOrder = await new Order({
        products: userCart.products,
        paymentIntent: {
          id: uniqid(),
          method: "COD",
          amount: finalAmount,
          status: "Cash on Delivery",
          create: Date.now(),
          currency: "usd",
        },
        orderby: user._id,
        orderStatus: "Cash on Delivery",
      }).save();
  
      if (!Array.isArray(userCart.products)) {
        throw new Error("Products in user cart is not an array");
      }
  
      let update = userCart.products.map((item) => {
        return {
          updateOne: {
            filter: { _id: item.product._id },
            update: { $inc: { quantity: -item.count, sold: +item.count } },
          },
        };
      });
  
      const updated = await Product.bulkWrite(update, {});
      res.json({ message: "success" });
  
    } catch (error) {
      throw new Error(error.message);
    }
  });

const getOrders = asyncHandler(async(req, res) => {
  const { _id } = req.user;
    validateMongoDbId(_id);
    try{
      const userorders = await Order.findOne({orderby: _id } ).populate("products.product").exec();
      res.json(userorders);
    }catch (error) {
      throw new Error(error);
    }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const updateOrderSt = await Order.findByIdAndUpdate(
      id,
      {
        orderStatus: status,
        paymentIntent: {
          status: status,
        }
      },
      { new: true } 
    );
    if (!updateOrderSt) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(updateOrderSt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = { 
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
};