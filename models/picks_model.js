const mongoose = require('mongoose');

// Define the schema for picks_model collection
const picksModelSchema = new mongoose.Schema({
  model: {
    type: String,
    required: true
  },
  pm: {
    type: String,  // Change from Number to String to match your DB
    required: true,
    validate: {
      validator: function(v) {
        return /^\d+$/.test(v);  // Validate it's a numeric string
      },
      message: 'PM must be a numeric string'
    }
  },
  g4_pm: {
    type: Number,
    required: false,
    set: (v) => typeof v === 'string' ? parseFloat(v.trim()) : v // Clean input
  },
  max_support: {
    type: String,
    required: false
  },
  ip: {
    type: String,
    required: false
  },
  pci: {
    type: String,
    required: true  // Make required since we use it
  },
  '1u': {
    type: String,
    required: true,  // Make required since we use it
    enum: ['Y', 'NA']  // Only allow these values
  },
  '2u': {
    type: String,
    required: true,  // Make required since we use it
    enum: ['Y', 'NA']  // Only allow these values
  }
}, { timestamps: true });

// Create a model based on the schema
const PicksModel = mongoose.model('PicksModel', picksModelSchema);

module.exports = PicksModel;