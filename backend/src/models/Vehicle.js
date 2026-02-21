const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    model: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    capacityKg: { type: Number, required: true, min: 0 },
    odometerKm: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Available', 'On Trip', 'In Shop', 'Retired'], default: 'Available' },
    licensePlate: { type: String, trim: true },
    purchaseDate: { type: Date },
    initialOdometerKm: { type: Number, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
