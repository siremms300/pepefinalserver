// servers/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import morgan from 'morgan'; 
import helmet from 'helmet';
import connectDB from './config/connectDB.js';
import userRouter from './route/userRoute.js';
import authRouter from './route/authRoute.js';
import CategoryRouter from './route/categoryRoute.js';
import ProductRouter from './route/productRoute.js';
import cartRouter from './route/cartRoutes.js'
import orderRouter from './route/orderRoute.js';
import addressRouter from './route/addressRoute.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.FRONTEND_URL) {
  throw new Error("Please provide FRONTEND_URL in the .env file");
}

// Initialize Express app
const app = express();

// CORS configuration - allow all origins for development
app.use(cors({
  credentials: true,
  origin: true // Allow all origins for mobile testing
}));

app.use(express.json());
app.use(cookieParser());
app.use(morgan('combined'));
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// Routes
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/categories', CategoryRouter);
app.use('/api/products', ProductRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/addresses', addressRouter);

app.get("/", (req, res) => {
  res.json({
    message: `Server is running on port ${process.env.PORT || 8080}`,
    status: "Server is accessible from network"
  });
}); 

// Server startup
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; // Listen on all network interfaces

async function startServer() {
  try { 
    app.listen(PORT, HOST, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`🌐 Server accessible at:`);
      console.log(`   - Local: http://localhost:${PORT}`);
      console.log(`   - Network: http://YOUR_IP_ADDRESS:${PORT}`);
      console.log(`📱 To access from phone: Use your computer's IP address`);
    });
    await connectDB();
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;




















































// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import cookieParser from 'cookie-parser';
// import morgan from 'morgan';
// import helmet from 'helmet';
// import connectDB from './config/connectDB.js';
// import userRouter from './route/userRoute.js';
// import authRouter from './route/authRoute.js';
// import CategoryRouter from './route/categoryRoute.js';
// import ProductRouter from './route/productRoute.js';
// import cartRouter from './route/cartRoutes.js'
// import orderRouter from './route/orderRoute.js';
// import addressRouter from './route/addressRoute.js';


// // Load environment variables
// dotenv.config();

// // Validate required environment variables
// if (!process.env.FRONTEND_URL || !process.env.ADMIN_URL) {
//   throw new Error("Please provide FRONTEND_URL and ADMIN_URL in the .env file");
// }

// // Initialize Express app
// const app = express();

// // CORS configuration - allow multiple origins
// const allowedOrigins = [
//   process.env.FRONTEND_URL,
//   process.env.ADMIN_URL
// ].filter(Boolean); // Remove any undefined values

// // app.use(cors({
// //   credentials: true,
// //   origin: function (origin, callback) {
// //     // Allow requests with no origin (like mobile apps or curl requests)
// //     if (!origin) return callback(null, true);
    
// //     if (allowedOrigins.indexOf(origin) !== -1) {
// //       callback(null, true);
// //     } else {
// //       callback(new Error('Not allowed by CORS'));
// //     }
// //   }
// // }));

// // Alternative simpler approach - allow all origins in development:
// app.use(cors({
//   credentials: true,
//   origin: true // Allow all origins (use only in development)
// }));

// app.use(express.json());
// app.use(cookieParser());
// app.use(morgan('combined'));
// app.use(helmet({
//   crossOriginResourcePolicy: false
// }));

// // Routes
// app.use('/api/users', userRouter);
// app.use('/api/auth', authRouter);
// app.use('/api/categories', CategoryRouter);
// app.use('/api/products', ProductRouter);
// app.use('/api/cart', cartRouter);
// app.use('/api/orders', orderRouter);
// app.use('/api/addresses', addressRouter);

// app.get("/", (req, res) => {
//   res.json({
//     message: `Server is running on port ${process.env.PORT || 8080}`,
//     allowedOrigins: allowedOrigins
//   });
// });

// // Server startup
// const PORT = process.env.PORT || 8080;

// async function startServer() {
//   try { 
//     app.listen(PORT, () => {
//       console.log(`✅ Server is running on port ${PORT}`);
//       console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
//     });
//     await connectDB();
//   } catch (error) {
//     console.error("❌ Failed to start server:", error.message);
//     process.exit(1);
//   }
// }

// // Start the server
// startServer();

// export default app;







































// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import cookieParser from 'cookie-parser';
// import morgan from 'morgan';
// import helmet from 'helmet';
// import connectDB from './config/connectDB.js';
// import userRouter from './route/userRoute.js';
// import authRouter from './route/authRoute.js';
// import CategoryRouter from './route/categoryRoute.js';

// // Load environment variables
// dotenv.config();

// // Validate required environment variables
// if (!process.env.FRONTEND_URL) {
//   throw new Error("Please provide FRONTEND_URL in the .env file");
// }

// // Initialize Express app
// const app = express();

// // Middleware
// app.use(cors({
//   credentials: true,
//   origin: process.env.FRONTEND_URL || process.env.ADMIN_URL
// }));
// app.use(express.json());
// app.use(cookieParser());
// app.use(morgan('combined'));
// app.use(helmet({
//   crossOriginResourcePolicy: false
// }));

// // Routes
// app.use('/api/users', userRouter) 
// app.use('/api/auth', authRouter) 
// app.use('/api/categories', CategoryRouter) 

// app.get("/", (req, res) => {
//   res.json({
//     message: `Server is running on port ${process.env.PORT || 8080}`
//   });
// });

// // Server startup
// const PORT = process.env.PORT || 8080;

// async function startServer() {
//   try { 
//     app.listen(PORT, () => {
//       console.log(`✅ Server is running on port ${PORT}`);
//     });
//     await connectDB();
//   } catch (error) {
//     console.error("❌ Failed to start server:", error.message);
//     process.exit(1);
//   }
// }
// // Start the server
// startServer();

// export default app;