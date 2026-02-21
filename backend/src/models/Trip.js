const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    cargoWeightKg: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'], default: 'Draft' },
    scheduledAt: { type: Date },
    onTime: { type: Boolean, default: true },
    distanceKm: { type: Number, min: 0, default: 0 },
    fuelUsedLiters: { type: Number, min: 0, default: 0 },
    fuelCost: { type: Number, min: 0, default: 0 },
    estimatedFuelCost: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
