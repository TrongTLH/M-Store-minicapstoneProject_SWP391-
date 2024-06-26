const Product = require("../models/productModel");
const User = require ("../models/userModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbId");

const createProduct = asyncHandler(async (req, res) => {
  try{
    if(req.body.title) {
      req.body.slug=slugify(req.body.title);
    }
    const newProduct = await Product.create(req.body);
    res.json(newProduct);
  }catch (error) {
    throw new Error(error);
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params; // Lấy giá trị của 'id' từ req.params
  validateMongoDbId(id);
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }
    const updateProduct = await Product.findOneAndUpdate({ _id: id }, req.body, {
      new: true,
    });
    res.json(updateProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params; // Lấy giá trị của 'id' từ req.params
  validateMongoDbId(id);
  try {
    const deleteProduct = await Product.findByIdAndDelete(id); // Sử dụng phương thức 'findByIdAndDelete'
    if (!deleteProduct) {
      res.status(404);
      throw new Error('Product not found');
    }
    res.json({ message: 'Product deleted successfully', product: deleteProduct });
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
});



const getaProduct = asyncHandler (async (req, res) =>{
  const {id} = req.params;
  validateMongoDbId(id);
  try {
    const findProduct = await Product.findById(id);
    res.json(findProduct);
  }
  catch (error){
    throw new Error(error)
  }
});

const getAllProduct = asyncHandler(async (req, res) => {
  try {
    //filter
    const queryObj = { ...req.query};
    const excludeFields = ['page','sort', 'limit','fields'];
    excludeFields.forEach((el) => delete queryObj[el]);
    console.log(queryObj);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    
    let query = Product.find (JSON.parse(queryStr));

    //sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query.sort(sortBy);
    } else {
      query.sort('-createdAt');
    }

    //limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query.select(fields);
    } else {
      query.select('-__v');
    }

    // pagination

    const page = req.query.page;
    const limit = req.query.limit;
    const skip = (page -1) * limit;
    query = query.skip(skip).limit(limit);
    if(req.query.page){
      const productCount = await Product.countDocuments();
      if(skip>= productCount) throw new Error('this page does not exists');
    }
    console.log(page, limit, skip);
  
    const products = await query;
    res.json(products);
  }catch(error){
    throw new Error(error);
  }
});

const addToWishList = asyncHandler(async(req, res) => {
  const { _id } = req.user;
  const { proId } = req.body;
  try{
    const user = await User.findById(_id);
    const alreadyadded = user.wishlist.find((id) => id.toString() === proId);
    if (alreadyadded) {
      let user = await  User.findByIdAndUpdate(
        _id, {
        $pull: { wishlist : proId},
      },
      {
        new: true,
      });
      res.json(user);
    }else{
      let user = await  User.findByIdAndUpdate(
        _id, 
        {
        $push: { wishlist : proId},
      },
      {
        new: true,
      });
      res.json(user);
    }
  }catch (error) {
    throw new Error(error);
  }
});

const rating = asyncHandler(async(req, res) => {
  const {_id } = req.user; 
  const { star, prodId, comment } = req.body;
  try {
    const product = await Product.findById(prodId);
  let alreadyRated = product.ratings.find(
    (userId) => userId.postedby.toString() === _id.toString() 
    );
    if(alreadyRated) {

      const updateRating = await Product.updateOne({
        ratings:{$elemMatch: alreadyRated},
      }, {
        $set:{"ratings.$.star":star, "ratings.$.comment":comment}
      }, {
        new:true,
      });
    } else{
      const rateProduct = await Product.findByIdAndUpdate(
        prodId,
        {
          $push: {
            ratings: {
              star: star,
              comment:comment,
              postedby: _id,
            },
          },
        },
        {
          new: true,
        }
      );
    }
    const getallratings = await Product.findById(prodId);
    let totalRating = getallratings.ratings.length;
    let ratingsum = getallratings.ratings
    .map((item) => item.star)
    .reduce((prev, curr) => prev + curr, 0);
    let actualRating = Math.round(ratingsum / totalRating);
    let finalproduct = await Product.findByIdAndUpdate(prodId, {
      totalrating:actualRating,
    },{
      new:true,
    }
    );
    res.json(finalproduct);
  }catch(error) {
    throw new Error(error);
  }
});


module.exports = {
  createProduct, 
  getaProduct, 
  getAllProduct ,
  updateProduct,
  deleteProduct,
  addToWishList,
  rating,
};