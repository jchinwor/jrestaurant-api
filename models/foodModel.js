const { required } = require("joi");
const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Food item name is required'] },
    description: String,
    price: { type: Number, required: [true, 'Food item price is required'] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    imageUrl: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User",required: true }, 
    available: { type: Boolean, default: true },
    
    //Review-related fields
    numReviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Food", foodSchema);
