const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  appointmentDate: { type: Date, required: true },
  notes: { type: String },
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
