const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    logger.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  // Optional: log slow queries if needed i am vandana
  mongoose.set('debug', function (coll, method, query, doc, options) {
    const start = Date.now();
    return function (err, result) {
      const duration = Date.now() - start;
      if (duration > 100) {
        logger.warn(`🐢 Slow query on ${coll}.${method} (${duration}ms): ${JSON.stringify(query)}`);
      }
    };
  });
};

module.exports = connectDB;
