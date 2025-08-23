const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { registerSchema, loginSchema, verificationCodeSchema, resetPasswordSchema, forgotPasswordSchema } = require('../middlewares/validator');
const transporter = require('../middlewares/sendMail');
const { hmacProcess } = require('../utils/hashing');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

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
    role
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

// @desc    Login user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const { error, value } = loginSchema.validate({ email, password });
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const user = await User.findOne({ email });
  if (!user) return next(new AppError('Invalid credentials', 400));

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return next(new AppError('Invalid credentials', 400));

  res.status(200).json({
    status: 'success', 
    message: 'User logged in successfully',
    data: {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
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


// @desc    Send verification code to user email
exports.sendVerificationCode = catchAsync(async (req, res) => {

  const { email } = req.body;  

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      status: 'fail',
      message: 'User not found'
    });
  }
  if(user.verified){
    return res.status(400).json({
      status: 'fail',
      message: 'User already verified'
    });
  }
  // Generate a verification code
 const verificationCode = Math.floor(100000 + Math.random() * 900000); // returns a number

  // Send verification code via email
  let info = await transporter.sendMail({
    from: `"Justiceres API" <${process.env.SMTP_USER}>`, // sender address
    to: user.email, // list of receivers 
    subject: "Verification Code", // Subject line
    text: `Your verification code is ${verificationCode}`, // plain text body 
    html: `<b>Your verification code is ${verificationCode}</b>` // html body
  });
  if(info.accepted[0] === user.email){
      const hashCodedValue = hmacProcess(verificationCode, process.env.JWT_SECRET);
      user.verificationCode = hashCodedValue; 
      user.verificationCodeValidation = Date.now() + 10 * 60 * 1000; // 10 minutes from now
      await user.save();
      return res.status(200).json({
        status: 'success',
        message: 'Verification code sent successfully'
      });
  }
  res.status(404).json({
    status: 'fail',
    message: 'Failed to send verification code'
  });

});

// @desc    Verify the verification code
exports.verifyVerificationCode = catchAsync(async (req, res, next) => {
  const { email, providedCode } = req.body;

  const { error, value } = verificationCodeSchema.validate({ email, providedCode });
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const codeValue = providedCode.toString();
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  if (user.verified) {
    return next(new AppError('User already verified', 400));
  }
  if (!user.verificationCode || !user.verificationCodeValidation) {
    return next(new AppError('Verification code not sent or expired', 400));
  }
  const hashCodedValue = hmacProcess(codeValue, process.env.JWT_SECRET);
  if (user.verificationCode !== hashCodedValue) {
    return next(new AppError('Invalid verification code', 400));
  }
  if (Date.now() > user.verificationCodeValidation) {
    return next(new AppError('Verification code has expired', 400));
  }
  user.verified = true;
  user.verificationCode = undefined; // Clear the verification code
  user.verificationCodeValidation = undefined; // Clear the validation time
  await user.save();
  res.status(200).json({
    status: 'success',
    message: 'User verified successfully',
    data: {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });

})

exports.resetPassword = catchAsync(async (req, res, next) => {

  const { _id:userId, verified } = req.user;
  const { oldPassword, newPassword } = req.body;

  const { error, value } = resetPasswordSchema.validate({ oldPassword, newPassword });
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  if (!verified) {
    return next(new AppError('User not verified', 400));
  }
  const user = await User.findById(userId).select('+password');
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return next(new AppError('Old password is incorrect', 400));
  } 
  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedNewPassword;
  await user.save();
  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully',
    data: {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });


}) 


// @desc    Send Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Generate a forgot password code
  const forgotPasswordCode = Math.floor(100000 + Math.random() * 900000); // returns a number
  // Send forgot password code via email
  let info = await transporter.sendMail({
    from: `"Justiceres API" <${process.env.SMTP_USER}>`, // sender address
    to: user.email, // list of receivers 
    subject: "Forgot Password Code", // Subject line
    text: `Your forgot password code is ${forgotPasswordCode}`, // plain text body 
    html: `<b>Your forgot password code is ${forgotPasswordCode}</b>` // html body
  });
  if(info.accepted[0] === user.email){
      const hashCodedValue = hmacProcess(forgotPasswordCode, process.env.JWT_SECRET);
      user.forgotPasswordCode = hashCodedValue; 
      user.forgotPasswordCodeValidation = Date.now() + 10 * 60 * 1000; // 10 minutes from now
      await user.save();
      return res.status(200).json({
        status: 'success',
        message: 'Forgot password code sent successfully'
      });
  }
  res.status(404).json({
    status: 'fail',
    message: 'Failed to send forgot password code'
  });


})


// @desc    Verify the forgetPassword code
exports.verifyForgotPasswordCode = catchAsync(async (req, res, next) => {
  const { email, providedCode, newPassword } = req.body;

  const { error, value } = forgotPasswordSchema.validate({ email, providedCode,newPassword });
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const codeValue = providedCode.toString();
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  if (!user.forgotPasswordCode || !user.forgotPasswordCodeValidation) {
    return next(new AppError('Forgot password code not sent or expired', 400));
  }
  const hashCodedValue = hmacProcess(codeValue, process.env.JWT_SECRET);
  if (user.forgotPasswordCode !== hashCodedValue) {
    return next(new AppError('Invalid forgot password code', 400));
  }
  if (Date.now() > user.forgotPasswordCodeValidation) {
    return next(new AppError('Forgot password code has expired', 400));
  }
  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedNewPassword;
  user.forgotPasswordCode = undefined; // Clear the forgot password code
  user.forgotPasswordCodeValidation = undefined; // Clear the validation time
  await user.save();  
  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully',
    data: {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });

})

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
