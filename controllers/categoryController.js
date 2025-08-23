const Category = require('../models/categoryModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// @desc    Get all categories
exports.getAllCategories = catchAsync(async (req, res) => {
  const categories = await Category.find({});
  res.status(200).json({
    status: 'success',
    results: categories.length,
    data: { categories }
  });
});

// @desc    Create category
exports.createCategory = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  const categoryExists = await Category.findOne({ name });
  if (categoryExists) return next(new AppError('Category already exists', 400));

  const category = await Category.create({ name });

  res.status(201).json({
    status: 'success',
    data: { category }
  });
});

// @desc    Update category
exports.updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Category not found', 404));

  category.name = req.body.name || category.name;
  const updatedCategory = await category.save();

  res.status(200).json({
    status: 'success',
    data: { updatedCategory }
  });
});

// @desc    Delete category
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Category not found', 404));

  await category.deleteOne();

  res.status(201).json({
    status: 'success',
    
    message: 'Category deleted successfully'
  });
});
