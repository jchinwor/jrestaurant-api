const Review = require('../models/reviewModel');
const Food = require('../models/foodModel');
const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose');
const AppError = require('../utils/appError');
const { createReviewSchema } = require('../middlewares/validator');

// @desc    Get reviews for a specific food item
exports.getReviewsByFoodId = catchAsync(async (req, res) => {
  const reviews = await Review.find({ food: req.params.foodId })
    .populate('user', 'name email');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews }
  });
});

// @desc    Create a review
exports.createReview = catchAsync(async (req, res, next) => {
  const { rating, comment, reviewTitle } = req.body;
  const { foodId } = req.params;

  const { error,value } = createReviewSchema.validate({ rating, comment, reviewTitle });
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  // Validate rating
  if (rating < 1 || rating > 5) {
    return next(new AppError('Rating must be between 1 and 5', 400));
  }
  // Validate foodId
  if (!foodId) {
    return next(new AppError('Food ID is required', 400));
  }
  // Check if foodId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(foodId)) {
    return next(new AppError('Invalid Food ID', 400));
  }
  // Check if food exists
  const food = await Food.findById(foodId);
  if (!food) return next(new AppError('Food item not found', 404));

  // Check if user already reviewed this food
  const existingReview = await Review.findOne({ food: foodId, user: req.user._id });
  if (existingReview) {
    return next(new AppError('You have already reviewed this food item', 400));
  }

  // Create new review
  const review = await Review.create({
    food: foodId,
    user: req.user._id,
    rating,
    comment,
    reviewTitle
  });

  // (Optional) Update food average rating
  const reviews = await Review.find({ food: foodId });
  const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

  food.numReviews = reviews.length;
  food.averageRating = avgRating;
  await food.save();

  res.status(201).json({
    status: 'success',
    message: 'Review added successfully',
    data: { review }
  });
});
// @desc    Update review
exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found', 404));

  const { error, value } = createReviewSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  // Check if the review belongs to the user
  if (!review.user || !review.user._id) {
    return next(new AppError('Review does not belong to any user', 400));
  }
  // Check if the user is authorized to update the review
  if (!req.user || !req.user._id) {
    return next(new AppError('User not authenticated', 401));
  }
  // Ensure the user is updating their own review
  if (!review.user.equals(req.user._id)) {
    return next(new AppError('Not authorized to update this review', 401));
  }
  // If the user is authorized, update the review
  if (!review.user.equals(req.user._id)) {
    return next(new AppError('Not authorized to update this review', 401));
  }
  // Update review fields
  review.rating = req.body.rating || review.rating;
  review.comment = req.body.comment || review.comment;
  review.reviewTitle = req.body.reviewTitle || review.reviewTitle;
  // Save updated review
  await review.save();
  // (Optional) Update food average rating
  const food = await Food.findById(review.food);
  if (!food) return next(new AppError('Food item not found', 404));
  const reviews = await Review.find({ food: food._id });
  const avgRating = reviews.reduce((acc, item) => item.rating + acc,
    0) / reviews.length;
  food.numReviews = reviews.length;
  food.averageRating = avgRating;
  await food.save();
  // Return updated review
  res.status(200).json({
    status: 'success',
    data: { review }
  });


});

// @desc    Delete review
exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found', 404));

  await review.deleteOne();

  // (Optional) Update food average rating
  const food = await Food.findById(review.food);
  if (!food) return next(new AppError('Food item not found', 404));
  const reviews = await Review.find({ food: food._id });
  const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / (reviews.length || 1); // Avoid division by zero
  food.numReviews = reviews.length;
  food.averageRating = avgRating;
  await food.save();
  // Return success response
  res.status(201).json({
    status: 'success',
    message: 'Review deleted successfully'
  });
});
