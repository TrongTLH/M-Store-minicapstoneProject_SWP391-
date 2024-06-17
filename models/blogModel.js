const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var blogSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        unique:true,
        index:true,
    },
    description:{
        type:String,
        required:true,
        unique:true,
    },
    category:{
        type:String,
        required:true,
        unique:true,
    },
    numViews:{
        type:Number,
        default: 0,
    },
    isLiked: {
      type: Boolean,
      default: false
    },
    isDisliked: {
      type: Boolean,
      default: false,
    },
    likes: [{
      type:mongoose.Schema.ObjectId,
      ref: "User",
      },
    ],
    dislikes: [{
      type:mongoose.Schema.ObjectId,
      ref: "User",
      },
    ],
    image: {
      type: String,
      default:
        "https://cdn1.concung.com/storage/data/2021/thong-tin-bo-ich/2024/03/Review%206%20lo%E1%BA%A1i%20s%E1%BB%AFa%20t%E1%BB%91t%20cho%20tr%E1%BA%BB%20s%C6%A1%20sinh%20d%C6%B0%E1%BB%9Bi%206%20th%C3%A1ng%20tu%E1%BB%95i.webp",
    },
    author: {
      type: String,
      default: "Admin",
    },

  },
  {
      toJSON: {
        virtuals: true,
      },
      toObject: {
        virtuals: true,
      },
      timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model('Blog', blogSchema);