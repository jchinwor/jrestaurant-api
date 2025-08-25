// routes/cartRoutes.js
const express = require("express");
const { addToCart, updateCartItem, removeCartItem, getCart } = require("../controllers/cartController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/add", addToCart);
router.get("/", getCart);
router.patch("/update", updateCartItem);
router.delete("/remove", removeCartItem);

module.exports = router;
