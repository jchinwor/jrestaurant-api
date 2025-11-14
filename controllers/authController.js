const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
// Resend may not support require(). If it doesn't, you might need to find an alternative or use dynamic import()
const { Resend } = require('resend'); 
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { registerSchema, loginSchema, verificationCodeSchema, resetPasswordSchema, forgotPasswordSchema } = require('../middlewares/validator');
const transporter = require('../middlewares/sendMail');
const { hmacProcess } = require('../utils/hashing');

const resend = new Resend(process.env.RESEND_API_KEY);
// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, role, biometric_enabled = false  } = req.body;

  const { error, value } = registerSchema.validate({ name, email, password, role });
  if (error) {  
    return next(new AppError(error.details[0].message, 400));
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) return next(new AppError('User already exists', 400));

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    biometric_enabled
  });

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    data: {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id, user.role)
    }
  });
});


exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("-password");
  
  if (!user) {
    return res.status(404).json({
      status: 'fail',
      message: 'User not found'
    });
  }

  res.status(200).json({
    status: 'success',
    data: user
  });
});

// @desc    Login user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const { error } = loginSchema.validate({ email, password });
  if (error) return next(new AppError(error.details[0].message, 400));

  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new AppError('Invalid Credentials', 400));

  if (!user.password) return next(new AppError('Invalid Credentials', 400));

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return next(new AppError('Invalid Credentials', 400));

  res.status(200).json({
    status: 'success',
    message: 'User logged in successfully',
    data: {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user.id, user.role)
    }
  });
});

// controllers/authController.js
exports.signout = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0) // Expire immediately
  });

  res.status(200).json({
    status: 'success',
    message: 'You have been signed out successfully.'
  });
};






// @desc    Reset Password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return next(new AppError('Missing required fields', 400));
  }

  // Hash token to compare with DB
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user by token and email
  const user = await User.findOne({
    email,
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // Token still valid
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // Update password
  user.password = await bcrypt.hash(newPassword, 10);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Send confirmation email
  await resend.emails.send({
    from: 'GhanaEats <support@jenkinschinwor.com>',
    to: email,
    subject: 'Password Reset Successful',
    html: `<p>Hello ${user.name || ''}, your password was successfully reset.</p>`,
  });

  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully',
  });
});



exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return next(new AppError('User not found', 404));

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins
  await user.save({ validateBeforeSave: false });

  // Create reset link
  const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

  // Send email via Resend
  await resend.emails.send({
    from: 'GhanaEats <support@jenkinschinwor.com>',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <p>Hello ${user.name || ''},</p>
      <p>You requested a password reset. Click below to set a new password:</p>
      <a href="${resetURL}" 
         style="background:#2563eb;color:#fff;padding:10px 20px;
         text-decoration:none;border-radius:5px;">Reset Password</a>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn’t request this, please ignore this email.</p>
    `,
  });

  res.status(200).json({
    status: 'success',
    message: 'Password reset link sent to email',
  });
});



// @desc    Get all users (Admin only)
exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users }
  });
});

// @desc    Get single user by ID
exports.getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return next(new AppError('User not found', 404));

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

// @desc    Update user
exports.updateUser = catchAsync(async (req, res, next) => {
  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 10);
  }

  const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!updatedUser) return next(new AppError('User not found', 404));

  res.status(200).json({
    status: 'success',
    data: { updatedUser }
  });
});

// @desc    Delete user
exports.deleteUser = catchAsync(async (req, res, next) => {
  const deletedUser = await User.findByIdAndDelete(req.params.id);
  if (!deletedUser) return next(new AppError('User not found', 404));

  res.status(204).json({
    status: 'success',
    message: 'User deleted successfully'
  });
});
