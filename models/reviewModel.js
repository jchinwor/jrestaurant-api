const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  reviewTitle: { type: String }
}, { timestamps: true });

// 🚨 Prevent duplicate review by same user on same food
reviewSchema.index({ food: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
