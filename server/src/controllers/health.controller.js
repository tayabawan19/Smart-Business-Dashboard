import mongoose from 'mongoose';

/**
 * Health check controller.
 * Returns server operational status, environment, uptime, and database connection state.
 */
export const getHealthStatus = (req, res) => {
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbState = mongoose.connection.readyState;

  res.status(200).json({
    status: 'ok',
    message: 'Smart Business Dashboard Backend API is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      connected: dbState === 1,
    },
  });
};
