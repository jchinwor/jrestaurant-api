const Cart = require("../models/cartModel");
const Food = require("../models/foodModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// Add item to cart
exports.addToCart = catchAsync(async (req, res, next) => {
  const { foodId, quantity } = req.body;

  const food = await Food.findById(foodId);
  if (!food) return next(new AppError("Food item not found", 404));

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [{ food: foodId, quantity }],
    });
  } else {
    const itemIndex = cart.items.findIndex(
      (item) => item.food.toString() === foodId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity; // update qty
    } else {
      cart.items.push({ food: foodId, quantity });
    }
  }

  await cart.save();
  res.status(200).json({ status: "success", data: cart });
});

// Get user cart
exports.getCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.food"
  );

  if (!cart) return res.status(200).json({ status: "success", data: { items: [] } });

  res.status(200).json({ status: "success", data: cart });
});

// Update cart item
exports.updateCartItem = catchAsync(async (req, res, next) => {
  const { foodId, quantity } = req.body;
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) return next(new AppError("Cart not found", 404));

  const itemIndex = cart.items.findIndex(
    (item) => item.food.toString() === foodId
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity = quantity;
    if (quantity <= 0) cart.items.splice(itemIndex, 1); // remove if qty <= 0
  } else {
    return next(new AppError("Item not found in cart", 404));
  }

  await cart.save();
  res.status(200).json({ status: "success", data: cart });
});

//Remove CartItem
exports.removeCartItem = catchAsync(async (req, res, next) => {
  const { foodId } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new AppError("Cart not found", 404));

  cart.items = cart.items.filter((i) => i.food.toString() !== foodId);
  await cart.save();

  res.status(200).json({ status: "success", data: cart });
});
