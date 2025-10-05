// routes/orderRoutes.js
const express = require("express");
const { placeOrder, getMyOrders, getAllOrders, updateOrder } = require("../controllers/orderController");
const { protect, admin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/place", placeOrder);
router.get("/my-orders", getMyOrders);
router.get("/all-orders", getAllOrders);
router.put("/:id",admin, updateOrder);

module.exports = router;
