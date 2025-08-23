// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect,admin } = require('../middlewares/authMiddleware');

// Public: Get all reviews for a specific food item
router.get('/food/:foodId', reviewController.getReviewsByFoodId);

// Protected: Create a review for a specific food item
router.post('/:foodId', protect, reviewController.createReview);

// Protected: Update a review by review ID
router.put('/:id', protect, reviewController.updateReview);

// Protected: Delete a review by review ID
router.delete('/:id', protect, admin, reviewController.deleteReview);

module.exports = router;
