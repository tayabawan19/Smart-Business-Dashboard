import mongoose from 'mongoose';

/**
 * User Schema
 * Represents an authenticated user in the Smart Business Dashboard.
 * Syncs with Firebase UID when users authenticate.
 */
const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
      default: '',
    },
    photoURL: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['admin', 'analyst', 'viewer'],
      default: 'analyst',
    },
    preferences: {
      theme: { type: String, default: 'dark' },
      currency: { type: String, default: 'USD' },
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
