const Joi =  require('joi');

// Validation schema for user registration
exports.registerSchema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required().email({ tlds: { allow: ['com','net'] },   }),
    password: Joi.string().min(6).required().messages({
    'string.pattern.base': `"password" must contain at least one uppercase letter, one lowercase letter, and one digit`
  }).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{6,}$')),  
    role: Joi.string().valid('user', 'admin').default('user')
});

// Validation schema for user login
exports.loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required().messages({
    'string.pattern.base': `"password" should not be less than 6 characters`
  }),   
});

exports.verificationCodeSchema = Joi.object({
    email: Joi.string().min(6).max(60).required().email({ tlds: { allow: ['com','net'] },   }),
    providedCode: Joi.number().required()
});

exports.resetPasswordSchema = Joi.object({
    // userId: Joi.string().required(),
    oldPassword: Joi.string().min(6).required().messages({
        'string.pattern.base': `"password" must contain at least one uppercase letter, one lowercase letter, and one digit`
    }).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{6,}$')),
    newPassword: Joi.string().min(6).required().messages({
        'string.pattern.base': `"password" must contain at least one uppercase letter, one lowercase letter, and one digit`
    }).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{6,}$')),
}); 

exports.forgotPasswordSchema = Joi.object({
    email: Joi.string().min(6).max(60).required().email({ tlds: { allow: ['com','net'] },   }),
    providedCode: Joi.number().required(),
    newPassword: Joi.string().min(6).required().messages({
        'string.pattern.base': `"password" must contain at least one uppercase letter, one lowercase letter, and one digit`
    }).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{6,}$')),
});

exports.createFoodSchema = Joi.object({
     name: Joi.string().min(3).messages({
    'string.base': `"name" should be a type of 'text'`,
    'string.empty': `"name" cannot be an empty field`,
    'string.min': `"name" should have a minimum length of {#limit}`,
  }),
  description: Joi.string().min(10).messages({
    'string.base': `"description" should be a type of 'text'`,
    'string.empty': `"description" cannot be an empty field`,
    'string.min': `"description" should have a minimum length of {#limit}`,
  }),
  price: Joi.number().positive().messages({
    'number.base': `"price" should be a type of 'number'`,
    'number.positive': `"price" must be a positive number`,
  }),
  category: Joi.string().required().messages({
    'string.base': `"category" should be a type of 'text'`,
  }),
});
exports.updateFoodSchema = Joi.object({
  name: Joi.string().min(3).messages({
    'string.base': `"name" should be a type of 'text'`,
    'string.empty': `"name" cannot be an empty field`,
    'string.min': `"name" should have a minimum length of {#limit}`,
  }),
  description: Joi.string().min(10).messages({
    'string.base': `"description" should be a type of 'text'`,
    'string.empty': `"description" cannot be an empty field`,
    'string.min': `"description" should have a minimum length of {#limit}`,
  }),
  price: Joi.number().positive().messages({
    'number.base': `"price" should be a type of 'number'`,
    'number.positive': `"price" must be a positive number`,
  }),
  category: Joi.string().allow('').messages({
    'string.base': `"category" should be a type of 'text'`,
  }),
});


exports.createReviewSchema = Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().required(),
    reviewTitle: Joi.string().allow('')
}).messages({
    'number.base': `"rating" should be a type of 'number'`,
    'number.min': `"rating" should have a minimum value of {#limit}`,
    'number.max': `"rating" should have a maximum value of {#limit}`,
    'any.required': `"rating" is a required field`
});
