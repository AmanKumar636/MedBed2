require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
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

// ✅ Add a default route for the root URL
app.get('/', (req, res) => {
  res.send("Welcome to MedBed API! 🚀 Visit /api for available endpoints.");
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Registration endpoint
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

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get hospitals endpoint
app.get('/api/hospitals', async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit feedback endpoint
app.post('/api/feedback', authenticateToken, async (req, res) => {
  const { feedback } = req.body;
  try {
    const newFeedback = new Feedback({ userId: req.user.userId, feedback });
    await newFeedback.save();
    res.json({ message: 'Feedback submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get appointment history endpoint
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.userId }).populate('hospitalId');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SOS endpoint
app.post('/api/sos', authenticateToken, async (req, res) => {
  const { latitude, longitude } = req.body;
  try {
    const sosRequest = new SOS({
      userId: req.user.userId,
      location: { latitude, longitude },
    });
    await sosRequest.save();
    res.json({ message: 'SOS alert sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
