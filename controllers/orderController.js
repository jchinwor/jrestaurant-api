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

// Get user orders
exports.getMyOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id }).populate("items.food");
  res.status(200).json({ status: "success", results: orders.length, data: orders });
});
