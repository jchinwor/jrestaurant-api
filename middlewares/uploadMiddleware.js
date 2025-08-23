const multer = require('multer');
const path = require('path');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/foods'); // Save files inside /uploads/foods
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `food-${Date.now()}${ext}`);
  }
});

// File filter (only images allowed)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
