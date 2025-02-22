// C:/Final2/backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt'); // using native bcrypt as per package.json
const jwt = require('jsonwebtoken');

// Import models
const User = require('./models/User');
const Hospital = require('./models/Hospital');
const Appointment = require('./models/Appointment');
const Feedback = require('./models/Feedback');
const SOS = require('./models/SOS');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.send("Welcome to MedBed API! 🚀");
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error(err));


// Middleware to authenticate token (for users and hospitals)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.sendStatus(403);
    req.user = payload;
    next();
  });
};

// ---------- User Endpoints ----------

// User registration
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user._id, email: user.email, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Hospital Endpoints ----------

// Hospital registration (with address and city)
app.post('/api/hospital/register', async (req, res) => {
  const { name, email, password, address, city } = req.body;
  try {
    const existingHospital = await Hospital.findOne({ email });
    if (existingHospital) return res.status(400).json({ error: 'Hospital already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const hospital = new Hospital({ name, email, password: hashedPassword, address, city });
    await hospital.save();
    res.json({ message: 'Hospital registered successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Hospital login
app.post('/api/hospital/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hospital = await Hospital.findOne({ email });
    if (!hospital) return res.status(400).json({ error: 'Hospital not found' });
    const match = await bcrypt.compare(password, hospital.password);
    if (!match) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ hospitalId: hospital._id, email: hospital.email, role: 'hospital' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hospital update counts (beds and oxygen)
app.put('/api/hospital/updateCounts', authenticateToken, async (req, res) => {
  if (req.user.role !== 'hospital') return res.status(403).json({ error: 'Access denied' });
  const { beds, oxygenCylinders } = req.body;
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.user.hospitalId, { beds, oxygenCylinders }, { new: true });
    res.json({ message: 'Counts updated successfully', hospital });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hospital update location (latitude and longitude)
app.put('/api/hospital/updateLocation', authenticateToken, async (req, res) => {
  if (req.user.role !== 'hospital') return res.status(403).json({ error: 'Access denied' });
  const { latitude, longitude } = req.body;
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.user.hospitalId, { latitude, longitude }, { new: true });
    res.json({ message: 'Location updated successfully', hospital });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Nearby Hospitals Endpoint ----------
// Query params: latitude, longitude, radius (in kilometers)
app.get('/api/hospitals/nearby', async (req, res) => {
  const { latitude, longitude, radius } = req.query;
  if (!latitude || !longitude || !radius) {
    return res.status(400).json({ error: 'Please provide latitude, longitude, and radius' });
  }
  try {
    const allHospitals = await Hospital.find({ latitude: { $ne: null }, longitude: { $ne: null } });
    // Haversine formula to compute distance between two points
    const toRad = (value) => (value * Math.PI) / 180;
    const filtered = allHospitals.filter(hospital => {
      const dLat = toRad(hospital.latitude - parseFloat(latitude));
      const dLon = toRad(hospital.longitude - parseFloat(longitude));
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(parseFloat(latitude))) *
          Math.cos(toRad(hospital.latitude)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = 6371 * c; // Earth radius in kilometers
      return distance <= parseFloat(radius);
    });
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Appointment Booking Endpoint ----------
// When a user books a hospital, reduce bed count by 1 and record an appointment.
app.post('/api/appointments/book', authenticateToken, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ error: 'Only users can book appointments' });
  const { hospitalId } = req.body;
  try {
    // Find the hospital
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) return res.status(400).json({ error: 'Hospital not found' });
    if (hospital.beds <= 0) return res.status(400).json({ error: 'No beds available' });

    // Deduct one bed
    hospital.beds = hospital.beds - 1;
    await hospital.save();

    // Create appointment with hospital details
    const appointment = new Appointment({
      userId: req.user.userId,
      hospitalId: hospital._id,
      appointmentDate: new Date(),
      hospitalName: hospital.name,
      hospitalAddress: hospital.address,
      hospitalEmail: hospital.email,
      notes: `Appointment booked on ${new Date().toLocaleDateString()}`
    });
    await appointment.save();

    res.json({ message: 'Appointment booked successfully', appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Additional endpoints (e.g., feedback, SOS) can be added as needed

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
