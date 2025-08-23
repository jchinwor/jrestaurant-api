// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Public: Get all categories
router.get('/', categoryController.getAllCategories);

// Admin only: Create category
router.post('/add-category', protect, admin, categoryController.createCategory);

// Admin only: Update category
router.put('/:id', protect, admin, categoryController.updateCategory);

// Admin only: Delete category
router.delete('/:id', protect, admin, categoryController.deleteCategory);

module.exports = router;
