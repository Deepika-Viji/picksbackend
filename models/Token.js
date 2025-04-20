// models/Token.js
const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Auto-remove expired tokens
  }
});

module.exports = mongoose.model('Token', tokenSchema);