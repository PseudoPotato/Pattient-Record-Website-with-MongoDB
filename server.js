const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/patient-records", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("⚠️ MongoDB connection failed:", err));

// Define Patient Schema
const patientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  gender: String,
  medicalHistory: String,
  allergies: String,
  height: Number,
  weight: Number,
  disease: String,
  timestamp: { type: Date, default: Date.now }
});

const Patient = mongoose.model("Patient", patientSchema);

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Serve HTML Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/patients", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "patients.html"));
});

// API Routes
app.post("/submit", async (req, res) => {
  try {
    const newPatient = new Patient(req.body);
    await newPatient.save();
    res.status(200).send("✅ Patient data saved successfully.");
  } catch (err) {
    res.status(500).send("⚠️ Failed to save data.");
  }
});

// Get all patients with pagination and search
app.get("/all-patients", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    const query = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { disease: searchRegex },
        { gender: searchRegex }
      ];
    }

    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      patients,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: "⚠️ Failed to fetch patients.", error: err.message });
  }
});

// Get patient by ID
app.get("/patient/:id", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: "⚠️ Failed to fetch patient.", error: err.message });
  }
});

// Update patient
app.put("/patient/:id", async (req, res) => {
  try {
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    
    res.json(updatedPatient);
  } catch (err) {
    res.status(500).json({ message: "⚠️ Failed to update patient.", error: err.message });
  }
});

// Delete patient
app.delete("/patient/:id", async (req, res) => {
  try {
    const deletedPatient = await Patient.findByIdAndDelete(req.params.id);
    
    if (!deletedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    
    res.json({ message: "Patient deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "⚠️ Failed to delete patient.", error: err.message });
  }
});

// Dashboard statistics
app.get("/stats", async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const diseaseWise = await Patient.aggregate([
      { $group: { _id: "$disease", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    res.json({ totalPatients, diseaseWise });
  } catch (err) {
    res.status(500).json({ message: "⚠️ Failed to fetch stats." });
  }
});

app.get("/gender-stats", async (req, res) => {
  try {
    const genderStats = await Patient.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } }
    ]);
    
    const genderMap = genderStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json(genderMap);
  } catch (err) {
    res.status(500).json({ message: "⚠️ Failed to fetch gender stats." });
  }
});

app.get("/recent-patients", async (req, res) => {
  try {
    const recentPatients = await Patient.find()
      .sort({ timestamp: -1 })
      .limit(6)
      .select('name age gender disease timestamp');
    res.json(recentPatients);
  } catch (err) {
    res.status(500).json({ message: "⚠️ Failed to fetch recent patients." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});