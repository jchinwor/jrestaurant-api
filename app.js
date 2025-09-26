// app.js
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./middlewares/errorMiddleware');
const path = require('path');
require('./config/passport'); // Ensure passport strategies are configured
const app = express();




// --- 1) GLOBAL MIDDLEWARES ---
app.use(helmet()); // Set security headers
app.use(cors());   // Enable CORS
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded body
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:9000","https://www.jenkinschinwor.com","http://localhost:8080","http://localhost:3000"],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
  })
  
); 

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --- 2) RATE LIMITING (BEFORE ROUTES) ---
// const limiter = rateLimit({
//   max: 100, // max requests
//   windowMs: 60 * 60 * 1000, // per hour
//   message: 'Too many requests from this IP, please try again later'
// });
// app.use('/api', limiter);

// --- 3) ROUTES ---
const userRoutes = require('./routes/userRoutes');
const foodRoutes = require('./routes/foodRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const oauthRoutes = require('./routes/oauthRoutes');

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/foods', foodRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use('/api/v1/auth', oauthRoutes);


app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      res.setHeader('Access-Control-Allow-Origin', '*')
    }
  })
)
// Serve static files from the "uploads" directory



// --- 4) HANDLE UNDEFINED ROUTES ---
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});



// --- 5) GLOBAL ERROR HANDLER ---
app.use(globalErrorHandler);

module.exports = app;
