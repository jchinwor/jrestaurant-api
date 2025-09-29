const Food = require('../models/foodModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { createFoodSchema, updateFoodSchema } = require('../middlewares/validator');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// @desc    Get all foods
exports.getAllFoods = catchAsync(async (req, res) => {
  const { page } = req.query;
  const foodsPerPage = 10;
  let pageNumber = 0;
  if(page <= 1){
    pageNumber = 0;
  } else {
    pageNumber = (page - 1) * foodsPerPage; 
  }
  
  const result = await Food.find().sort({ createdAt: -1 }) .skip(pageNumber * foodsPerPage).limit(foodsPerPage).populate({path:'userId', select: 'email'});

  res.status(200).json({
    status: 'success',  
    results: result.length,
    data: result
});

})

// @desc    Get single food item
exports.getFoodById = catchAsync(async (req, res, next) => {
  const food = await Food.findById(req.params.id).populate('category', 'name');
  if (!food) return next(new AppError('Food not found', 404));

  res.status(200).json({
    status: 'success',
    data: food 
  });
});

// @desc    Create food
exports.createFood = catchAsync(async (req, res) => {
  const { name, description, price, category} = req.body;
  const { error, value } = createFoodSchema.validate({
    name,
    description,
    price,
    category
  });
  if (error) {
    return res.status(400).json({
      status: 'fail',
      message: error.details[0].message
    });
  }
  const foodExists = await Food.find ({ name });
  if (foodExists.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Food item already exists'
    });
  }
  if (!req.file) {
    return res.status(400).json({
      status: 'fail',
      message: 'Image file is required'
    });
  }
  
  // Create food item
  const food = await Food.create({
    name,
    description,
    price,
    category,
    userId: req.user.id, // assuming you have user auth middleware
    imageUrl: req.file ? `/uploads/foods/${req.file.filename}` : null
  });

  res.status(201).json({
    status: 'success',
    data: { food }
  });
});
// @desc    Update food
// exports.updateFood = catchAsync(async (req, res, next) => {
// const { _id:userId, } = req.user;
//   const { name, description, price, category } = req.body;
//   const { error, value } = updateFoodSchema.validate({
//     name,
//     description,
//     price,
//     category
//   });
//   if (error) {
//     return res.status(400).json({
//       status: 'fail',
//       message: error.details[0].message
//     });
//   }
//   if (!req.file && !name && !description && !price && !category) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'At least one field must be provided for update'
//     });
//   }
//   if (req.file && !req.file.mimetype.startsWith('image')) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Only image files are allowed'
//     });
//   }

//   // Find food item
//   const food = await Food.findById(req.params.id);
  
//   if (!food) return next(new AppError('Food not found', 404));

//   if (!food.userId.equals(userId)) {
//   return next(new AppError('You are not authorized to update this food item', 403));
// }
// //   if (req.file) {
// //   food.imageUrl = `/uploads/foods/${req.file.filename}`
// // }
//   if (req.file) {
//   console.log('Uploaded file:', req.file);
//   food.imageUrl = `/uploads/foods/${req.file.filename}`;
//   console.log('Image URL set to:', food.imageUrl);
// }
//   food.name = req.body.name || food.name;
//   food.description = req.body.description || food.description;
//   food.price = req.body.price || food.price;
//   food.category = req.body.category || food.category;

//   const updatedFood = await food.save();

//   res.status(200).json({
//     status: 'success',
//     data: { updatedFood }
//   });
// });

exports.updateFood = catchAsync(async (req, res, next) => {
  const { _id: userId } = req.user;
  const { name, description, price, category } = req.body;

  const { error } = updateFoodSchema.validate({ name, description, price, category });
  if (error) {
    return res.status(400).json({ status: 'fail', message: error.details[0].message });
  }

  if (!req.file && !name && !description && !price && !category) {
    return res.status(400).json({ status: 'fail', message: 'At least one field must be provided for update' });
  }

  const food = await Food.findById(req.params.id);
  if (!food) return next(new AppError('Food not found', 404));
  if (!food.userId.equals(userId)) return next(new AppError('You are not authorized to update this food item', 403));

  // ✅ Upload image to Cloudinary
  if (req.file) {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'foods' },
      async (error, result) => {
        if (error) return next(new AppError('Cloudinary upload failed', 500));

        food.imageUrl = result.secure_url;
        food.name = name || food.name;
        food.description = description || food.description;
        food.price = price || food.price;
        food.category = category || food.category;

        const updatedFood = await food.save();

        return res.status(200).json({
          status: 'success',
          data: { updatedFood }
        });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } else {
    // ✅ No image — just update fields
    food.name = name || food.name;
    food.description = description || food.description;
    food.price = price || food.price;
    food.category = category || food.category;

    const updatedFood = await food.save();

    return res.status(200).json({
      status: 'success',
      data: { updatedFood }
    });
  }
});

// @desc    Delete food
exports.deleteFood = catchAsync(async (req, res, next) => {
  const food = await Food.findById(req.params.id);
  if (!food) return next(new AppError('Food not found', 404));

  await food.deleteOne();

  res.status(204).json({
    status: 'success',
    message: 'Food deleted successfully'
  });
});
