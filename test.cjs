const mongoose = require('mongoose');

const uri = 'mongodb+srv://AmanKumar636:MedBed%40123@cluster0.1oqts.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Replace with your actual MongoDB URI

// Connect to MongoDB
mongoose.connect(uri)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    uploadData(); // Call function to upload data after successful connection
  })
  .catch((err) => {
    console.error('❌ Error connecting to MongoDB:', err);
  });

// Define Hospital Schema
const hospitalSchema = new mongoose.Schema({
  name: String,
  address: String,
  city: String,
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true }
  },
  bedsAvailable: Number,
  oxygenCylinders: Number
});

// Add a GeoJSON index for geospatial queries
hospitalSchema.index({ location: "2dsphere" });

const Hospital = mongoose.model('Hospital', hospitalSchema);

// Define Hospital Data
const newData = [
  {
    name: "Apollo Hospital",
    address: "21 Greams Road",
    city: "Chennai",
    location: { type: "Point", coordinates: [80.250, 13.070] },
    bedsAvailable: 250,
    oxygenCylinders: 500
  },
  {
    name: "Fortis Hospital",
    address: "Bannergatta Road",
    city: "Bangalore",
    location: { type: "Point", coordinates: [77.6000, 12.9750] },
    bedsAvailable: 200,
    oxygenCylinders: 400
  },
  {
    name: "Sahyadri Hospital",
    address: "Karve Road",
    city: "Pune",
    location: { type: "Point", coordinates: [73.8600, 18.5300] },
    bedsAvailable: 180,
    oxygenCylinders: 350
  },
  {
    name: "Narayana Health",
    address: "NH 44",
    city: "Hyderabad",
    location: { type: "Point", coordinates: [78.4900, 17.3900] },
    bedsAvailable: 220,
    oxygenCylinders: 450
  },
  {
    name: "CMC Hospital",
    address: "IDA Scudder Road",
    city: "Vellore",
    location: { type: "Point", coordinates: [79.1400, 12.9400] },
    bedsAvailable: 210,
    oxygenCylinders: 420
  },
  {
    name: "Kokilaben Hospital",
    address: "Andheri West",
    city: "Mumbai",
    location: { type: "Point", coordinates: [72.8800, 19.0800] },
    bedsAvailable: 280,
    oxygenCylinders: 500
  },
  {
    name: "Medanta Hospital",
    address: "Sector 38",
    city: "Gurgaon",
    location: { type: "Point", coordinates: [77.0300, 28.4600] },
    bedsAvailable: 230,
    oxygenCylinders: 480
  },
  {
    name: "Manipal Hospital",
    address: "Old Airport Road",
    city: "Bangalore",
    location: { type: "Point", coordinates: [77.6500, 12.9650] },
    bedsAvailable: 200,
    oxygenCylinders: 420
  },
  {
    name: "Max Super Speciality Hospital",
    address: "Saket",
    city: "Delhi",
    location: { type: "Point", coordinates: [77.2200, 28.6500] },
    bedsAvailable: 250,
    oxygenCylinders: 490
  },
  {
    name: "Ruby Hall Clinic",
    address: "Sassoon Road",
    city: "Pune",
    location: { type: "Point", coordinates: [73.8800, 18.5300] },
    bedsAvailable: 180,
    oxygenCylinders: 360
  },
  {
    name: "Amrita Hospital",
    address: "Ponekkara",
    city: "Kochi",
    location: { type: "Point", coordinates: [76.2700, 10.0200] },
    bedsAvailable: 190,
    oxygenCylinders: 370
  },
  {
    name: "Tata Memorial Hospital",
    address: "Dr. E Borges Road",
    city: "Mumbai",
    location: { type: "Point", coordinates: [72.8500, 19.0100] },
    bedsAvailable: 260,
    oxygenCylinders: 520
  },
  {
    name: "Columbia Asia Hospital",
    address: "Yeshwanthpur",
    city: "Bangalore",
    location: { type: "Point", coordinates: [77.5600, 13.0200] },
    bedsAvailable: 200,
    oxygenCylinders: 400
  },
  {
    name: "Christian Medical College",
    address: "Ida Scudder Road",
    city: "Vellore",
    location: { type: "Point", coordinates: [79.1300, 12.9250] },
    bedsAvailable: 220,
    oxygenCylinders: 440
  }
];

// Function to Upload Data to MongoDB
async function uploadData() {
  try {
    await Hospital.insertMany(newData);
    console.log('✅ Data uploaded successfully');
  } catch (err) {
    console.error('❌ Error uploading data:', err);
  } finally {
    mongoose.connection.close(); // Close connection after operation
  }
}
