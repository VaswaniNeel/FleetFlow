const MaintenanceLog = require('../models/MaintenanceLog');
const Vehicle = require('../models/Vehicle');
const { getNextCode } = require('../utils/generateCodes');

async function list(req, res, next) {
  try {
    const logs = await MaintenanceLog.find()
      .populate('vehicle', 'code model')
      .sort({ date: -1 })
      .lean();
    res.json(
      logs.map((l) => ({
        id: l.code,
        vehicleId: l.vehicle?.code,
        vehicle: l.vehicle?.model,
        issue: l.issue,
        date: l.date,
        cost: l.cost,
        status: l.status,
      }))
    );
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { vehicleCode, issue, date, cost, status } = req.body;
    const vehicle = await Vehicle.findOne({ code: vehicleCode });
    if (!vehicle) return res.status(400).json({ message: 'Invalid vehicle code' });
    const code = await getNextCode(MaintenanceLog, 'MNT');
    const log = await MaintenanceLog.create({
      code,
      vehicle: vehicle._id,
      issue: issue || 'Service',
      date: date ? new Date(date) : new Date(),
      cost: cost ?? 0,
      status: status || 'Scheduled',
    });
    const populated = await MaintenanceLog.findById(log._id).populate('vehicle', 'code model').lean();
    res.status(201).json({
      code: populated.code,
      id: populated.code,
      vehicleId: populated.vehicle?.code,
      vehicle: populated.vehicle?.model,
      issue: populated.issue,
      date: populated.date,
      cost: populated.cost,
      status: populated.status,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create };
