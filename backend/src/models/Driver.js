const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, trim: true },
    licenseType: { type: String, required: true, trim: true },
    licenseExpiry: { type: Date, required: true },
    completionRate: { type: Number, min: 0, max: 100, default: 0 },
    safetyScore: { type: Number, min: 0, max: 100, default: 0 },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Driver', driverSchema);
