// controllers/orderController.js
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Food = require("../models/foodModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");


// @desc    Get all orders
exports.getAllOrders = catchAsync(async (req, res) => {
  const orders = await Order.find({});
  res.status(200).json({
    status: 'success',
    results: orders.length,
     orders
  });
});

// Place order
exports.placeOrder = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.food");
  if (!cart || cart.items.length === 0) {
    return next(new AppError("Cart is empty", 400));
  }

  const orderItems = cart.items.map((item) => ({
    food: item.food._id,
    quantity: item.quantity,
    price: item.food.price
  }));

  const totalPrice = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    totalPrice
  });

  // Clear cart after placing order
  cart.items = [];
  await cart.save();

  res.status(201).json({ status: "success", data: order });
});

// @desc    Update order status or payment status
// @route   PATCH /api/orders/:id
// @access  Admin (or user if you want limited control)
exports.updateOrder = catchAsync(async (req, res, next) => {
  const { status, paymentStatus } = req.body;

  // Only allow updating specific fields
  const updateData = {};
  if (status) updateData.status = status;
  if (paymentStatus) updateData.paymentStatus = paymentStatus;

  const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).populate("user items.food");

  if (!order) {
    return next(new AppError("No order found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: order,
  });
});


// Get user orders
exports.getMyOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id }).populate("items.food");
  res.status(200).json({ status: "success", results: orders.length, data: orders });
});
