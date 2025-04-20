const mongoose = require('mongoose');

// Define the schema
const picksHardwareSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  products: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.every(product => typeof product === 'string');
      },
      message: props => `${props.value} contains invalid product entries!`
    }
  }
}, { timestamps: true }); // Adds createdAt and updatedAt fields

// Create and export the model
const PicksHardware = mongoose.model('PicksHardware', picksHardwareSchema);
module.exports = PicksHardware;
