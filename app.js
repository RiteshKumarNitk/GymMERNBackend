const morgan = require('morgan');
const { morganMiddleware } = require('./utils/logger');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const setupRoutes = require('./routes/setupRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const memberRoutes = require('./routes/memberRoutes');
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('combined', { stream: morganMiddleware }));


// Database Connection
require('./config/db')();

// Initialize scheduled jobs
const { initSubscriptionJobs } = require('./jobs/subscriptionJobs');
initSubscriptionJobs();


// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tenants', require('./routes/tenantRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));

app.use('/api/superadmin', require('./routes/superadminRoutes'));
app.use('/api/gym', require('./routes/gymRoutes'));
app.use('/api/setup', setupRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/members', memberRoutes);  

// Error Handling Middleware
const { logger } = require('./utils/logger');
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Log the error
  logger.error(`${err.message}\nStack: ${err.stack}`);
  
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = app;