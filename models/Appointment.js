// C:/Final2/backend/models/Appointment.js
const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  appointmentDate: { type: Date, required: true },
  notes: { type: String },
  hospitalName: { type: String },      // Added for appointment record
  hospitalAddress: { type: String },   // Added for appointment record
  hospitalEmail: { type: String }      // Added for appointment record
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
