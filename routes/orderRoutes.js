// routes/orderRoutes.js
const express = require("express");
const { placeOrder, getMyOrders, getAllOrders } = require("../controllers/orderController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/place", placeOrder);
router.get("/my-orders", getMyOrders);
router.get("/all-orders", getAllOrders);

module.exports = router;
