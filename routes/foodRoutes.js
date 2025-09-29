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
router.put('/:id', protect, admin, upload.single('image'), foodController.updateFood);

// router.put('/:id', protect, admin, upload.single('image'), (req, res, next) => {
//   if (req.file) {
//     const fullPath = path.join(process.cwd(), 'uploads', 'foods', req.file.filename);
//     console.log('Checking file at:', fullPath);
//     console.log('Exists:', fs.existsSync(fullPath));

//     // ✅ List all files in the uploads/foods folder
//     const folderPath = path.join(process.cwd(), 'uploads', 'foods');
//     try {
//       const files = fs.readdirSync(folderPath);
//       console.log('Current files in uploads/foods:', files);
//     } catch (err) {
//       console.error('Error reading uploads folder:', err.message);
//     }
//   }
//   next();
// });


// router.put('/:id', upload.single('image'), protect, admin, (req, res, next) => {
//   if (req.file) {
//     const fullPath = path.join(process.cwd(), 'uploads', 'foods', req.file.filename);
//     console.log('Checking file at:', fullPath);
//     console.log('Exists:', fs.existsSync(fullPath));
//     console.log('req.file.path:', req.file.path);


//     // Manual write test
//     const testPath = path.join(process.cwd(), 'uploads', 'foods', 'test.txt');
//     try {
//       fs.writeFileSync(testPath, 'test content');
//       console.log('Manual write success:', fs.existsSync(testPath));
//     } catch (err) {
//       console.error('Manual write failed:', err.message);
//     }
//   }
//   next();
// });



// Admin only: Delete food
router.delete('/:id', protect, admin, foodController.deleteFood);

module.exports = router;
