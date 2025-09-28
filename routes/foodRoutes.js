// routes/foodRoutes.js
const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const upload = require('../middlewares/uploadMiddleware');
const { protect, admin } = require('../middlewares/authMiddleware');
const fs = require('fs');
const path = require('path');

// Public: Get all food items
router.get('/', foodController.getAllFoods);

// Public: Get single food item
router.get('/:id',foodController.getFoodById);

// Admin only: Create food
router.post(
  '/create-food',
  upload.single('image'),protect, admin,foodController.createFood
);


// Admin only: Update food
// router.put('/:id', protect, admin, upload.single('image'), foodController.updateFood);
router.put('/:id', protect, admin, upload.single('image'), (req, res, next) => {
  console.log('Resolved upload path:', uploadPath);

  if (req.file) {
    const fullPath = path.join(__dirname, 'uploads/foods', req.file.filename);
    console.log('Checking file at:', fullPath);
    console.log('Exists:', fs.existsSync(fullPath));
  }
  next();
});


// Admin only: Delete food
router.delete('/:id', protect, admin, foodController.deleteFood);

module.exports = router;
