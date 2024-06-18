const Coupon = require("../models/couponModel");
const validateMongoDbId = require("../utils/validateMongodbId");
const asynHandler = require("express-async-handler");

const createCoupon = asynHandler(async(req, res) => {
  try{
    const newCoupon = await Coupon.create(req.body);
    res.json(newCoupon);
  }catch(error) {
    throw new Error(error)
  }
});

const getallCoupon = asynHandler(async(req, res) => {
  try{
    const Coupons = await Coupon.find();
    res.json(Coupons);
  }catch(error) {
    throw new Error(error)
  }
});

const updateCoupon = asynHandler(async(req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try{
    const updateCoupon = await Coupon.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updateCoupon);
  }catch(error) {
    throw new Error(error)
  }
});

const deleteCoupon = asynHandler(async(req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try{
    const deleteCoupon = await Coupon.findByIdAndDelete(id);
    res.json(deleteCoupon);
  }catch(error) {
    throw new Error(error)
  }
});

module.exports = {
  createCoupon,
  getallCoupon,
  updateCoupon,
  deleteCoupon,
};