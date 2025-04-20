const mongoose = require('mongoose');

const PicksParametersSchema = new mongoose.Schema({
  Frontend: { type: String, required: true },
  Backend: { type: String, required: true },
});

const PicksParameters = mongoose.model('PicksParameters', PicksParametersSchema);

module.exports = PicksParameters;
