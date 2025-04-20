const mongoose = require('mongoose');

// Define the schema for the picks_table collection
const picksTableSchema = new mongoose.Schema({
  Model: {
    type: String,
    required: true  // Model can still be required if it's essential
  },
  'Product Type': {
    type: String, 
    required: true  // Product Type can also be required
  },
  Resolution: {
    type: String,  // Store resolution as a string (e.g., '1080p', '4K')
    required: false  // Make Resolution optional
  },
  Bitrate: {
    type: Number,  // Store bitrate as a number (e.g., 5000 for 5000 kbps)
    required: false  // Make Bitrate optional
  },
  Framerate: {
    type: Number,  // Store framerate as a number (e.g., 30, 60)
    required: false  // Make Framerate optional
  },
  RM: {
    type: Number,
    required: false  // Make RM optional
  },
  MEM: {
    type: String,  // Store memory as a string (e.g., '16 GB', '32 GB')
    required: false  // Make MEM optional
  },
  CPU: {
    type: Number,
    required: false  // Make CPU optional
  }
}, { timestamps: true }); // Timestamps for createdAt and updatedAt

// Create a model based on the schema
const PicksTable = mongoose.model('PicksTable', picksTableSchema);

module.exports = PicksTable;
