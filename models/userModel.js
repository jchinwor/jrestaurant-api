// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: [true, "Email already exists"],
      lowercase: true,
      trim: true,
      minlength: [5, "Email must be at least 5 characters long"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    password: {
      type: String,
      trim: true,
      required: function () {
        return this.provider === "local"; // only require for local signup
      },
      select: false, // hide password by default
    },
    verified: {
      type: Boolean,
      default: false,
    },
    biometric_enabled: {
      type: Boolean,
      default: false,
    },

    // ✅ Email verification
    verificationCode: {
      type: String,
      default: "",
    },
    verificationCodeValidation: {
      type: Number,
      default: null,
    },

    // ❌ DEPRECATED (you can remove these safely if switching to token link reset)
    // forgotPasswordCode: {
    //   type: String,
    //   default: "",
    // },
    // forgotPasswordCodeValidation: {
    //   type: Number,
    //   default: null,
    // },

    // ✅ New fields for password reset via link
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },

    googleId: { type: String },
    provider: { type: String, enum: ["local", "google"], default: "local" },
    avatar: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
