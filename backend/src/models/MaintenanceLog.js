const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    issue: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    cost: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed'], default: 'Scheduled' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
