// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: [true,'Email already exists'],
    lowercase: true,
    trim: true,
    minlength: [5, 'Email must be at least 5 characters long'],
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    trim: true,
    required: [true, 'Please add a password'],
    Select: false,
  },
  verified:{
    type: Boolean,
    default: false
  },
  verificationCode:{
    type: String,
    default: false
  },
  verificationCodeValidation:{
    type: Number,
    default: false
  },
    forgotPasswordCode: {
        type: String,
        default: ''
    },
    forgotPasswordCodeValidation: {
        type: Number,
        default: false
    }
},{ timestamps: true });

module.exports = mongoose.model('User', userSchema);
