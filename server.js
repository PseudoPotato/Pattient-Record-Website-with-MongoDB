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

// Serve HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Submit Data
app.post("/submit", async (req, res) => {
  try {
    const newPatient = new Patient(req.body);
    await newPatient.save();
    res.status(200).send("✅ Patient data saved successfully.");
  } catch (err) {
    res.status(500).send("⚠️ Failed to save data.");
  }
});

// Get Total Patients
app.get("/stats", async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const diseaseWise = await Patient.aggregate([
      { $group: { _id: "$disease", count: { $sum: 1 } } }
    ]);
    res.json({ totalPatients, diseaseWise });
  } catch (err) {
    res.status(500).json({ message: "⚠️ Failed to fetch stats." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
