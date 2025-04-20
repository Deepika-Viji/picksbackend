const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
 
// Load env vars
dotenv.config();
 
// Import DB and routes
const connectDB = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');
 
const calculationRoute = require('./routes/calculate');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const picksHardwareRoutes = require('./routes/picks_hardware');
const picksApplicationRoutes = require('./routes/picks_application');
const picksTableRoutes = require('./routes/picks_table');
const picksModelRoutes = require('./routes/picks_model');
const picksParametersRoutes = require('./routes/picks_parameter');
const picksChannelRoutes = require('./routes/picks_channel');
const configurationRoutes = require('./routes/picks_configuration');
 
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
 
const app = express();
const port = process.env.PORT || 5000;
 
// Middleware: Security and logging
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", ...allowedOrigins]
    }
  },
  hsts: {
    maxAge: 63072000, // 2 years in seconds
    includeSubDomains: true,
    preload: true
  }
}));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(cookieParser(process.env.JWT_SECRET));
 
// Middleware: CORS setup
const corsOptions = {
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['Authorization', 'Set-Cookie']
};
 
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
 
// Middleware: Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
 
// Connect to MongoDB with retry logic
const connectWithRetry = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    setTimeout(connectWithRetry, 5000);
  }
};
connectWithRetry();
 
// Routes: API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/configurations', configurationRoutes);
app.use('/api/calculate', calculationRoute);
app.use('/api/hardware', picksHardwareRoutes);
app.use('/api/application', picksApplicationRoutes);
app.use('/api/calculate/tables', picksTableRoutes);
app.use('/api/calculate/models', picksModelRoutes);
app.use('/api/picksparameters', picksParametersRoutes);
app.use('/api/channels', picksChannelRoutes);
 
// Route: Auth verification
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Access granted', user: req.user });
});
 
// Route: Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});
 
// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendPath));
 
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}
 
// 404 Not Found handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
 
// Global Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
 
// Start the server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
 
// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server terminated');
    process.exit(0);
  });
});