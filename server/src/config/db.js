import mongoose from 'mongoose';

/**
 * Connect to MongoDB using Mongoose.
 * Logs connection status and handles connection error gracefully.
 */
export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_business_dashboard';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${mongoUri}`);
    console.warn(`[MongoDB Note] ${error.message}`);
    console.warn(`[MongoDB Note] Running in database offline mode. Please start MongoDB service when ready.`);
  }
};
