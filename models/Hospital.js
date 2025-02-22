// C:/Final2/backend/models/Hospital.js
const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  beds: { type: Number, default: 0 },
  oxygenCylinders: { type: Number, default: 0 },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null }
});

module.exports = mongoose.model('Hospital', HospitalSchema);
