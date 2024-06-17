const { generateToken } = require("../config/jwtToken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const validate = require("../utils/validate");
const { generateRefreshToken } = require("../config/refreshtoken");
const jwt = require("jsonwebtoken");
const validateMongoDbId = require("../utils/validateMongodbId");
const sendEmail = require("./emailController");
const crypto = require("crypto");

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
};