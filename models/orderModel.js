// models/orderModel.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        food: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true } // store snapshot of price at order time
      }
    ],
    totalPrice: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["pending", "confirmed", "preparing", "delivered", "cancelled"], 
      default: "pending" 
    },
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
