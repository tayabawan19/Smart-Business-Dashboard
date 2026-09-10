import mongoose from 'mongoose';

/**
 * Column Schema definition
 */
const columnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['number', 'date', 'text'],
      default: 'text',
    },
    sampleValues: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

/**
 * Dataset Schema definition
 * Represents a parsed and validated business dataset.
 */
const datasetSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['csv', 'xlsx', 'xls'],
      required: true,
    },
    rowCount: {
      type: Number,
      required: true,
      min: 1,
    },
    columnCount: {
      type: Number,
      required: true,
      min: 1,
    },
    columns: {
      type: [columnSchema],
      required: true,
      default: [],
    },
    data: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
      default: [],
    },
    chartCache: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    analysisCache: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    insightsCache: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'ready',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast retrieval of a user's upload history
datasetSchema.index({ userId: 1, createdAt: -1 });

export const Dataset = mongoose.model('Dataset', datasetSchema);
