const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  beds: { type: Number, required: true },
  oxygenCylinders: { type: Number, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
});

module.exports = mongoose.model('Hospital', HospitalSchema);
