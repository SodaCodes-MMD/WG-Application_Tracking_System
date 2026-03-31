const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: String,
  lastName: String,
  name: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  passwordUpdatedAt: Date
});

// Password Reset Token Schema
const passwordResetTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
passwordResetTokenSchema.index({ userId: 1 });

const User = mongoose.model('User', userSchema);
const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

module.exports = {
  User,
  PasswordResetToken
};