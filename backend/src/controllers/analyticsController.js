const Trip = require('../models/Trip');
const MaintenanceLog = require('../models/MaintenanceLog');
const Vehicle = require('../models/Vehicle');

async function expenseSummary(req, res, next) {
  try {
    const completedTrips = await Trip.find({ status: 'Completed' }).lean();
    const maintenanceLogs = await MaintenanceLog.find().lean();
    const totalFuelCost = completedTrips.reduce((s, t) => s + (t.fuelCost || 0), 0);
    const totalDistance = completedTrips.reduce((s, t) => s + (t.distanceKm || 0), 0);
    const totalFuelUsed = completedTrips.reduce((s, t) => s + (t.fuelUsedLiters || 0), 0);
    const maintenanceCost = maintenanceLogs.reduce((s, l) => s + (l.cost || 0), 0);
    const costPerKm = totalDistance > 0 ? totalFuelCost / totalDistance : 0;
    res.json({
      totalFuelCost,
      totalDistance,
      totalFuelUsed,
      maintenanceCost,
      costPerKm: Number(costPerKm.toFixed(2)),
    });
  } catch (err) {
    next(err);
  }
}

async function fuelEfficiency(req, res, next) {
  try {
    const data = await Trip.aggregate([
      { $match: { status: 'Completed', distanceKm: { $gt: 0 }, fuelUsedLiters: { $gt: 0 } } },
      { $group: { _id: { $month: '$createdAt' }, distance: { $sum: '$distanceKm' }, fuelUsed: { $sum: '$fuelUsedLiters' } } },
      { $project: { _id: 0, monthNum: '$_id', efficiency: { $divide: ['$distance', '$fuelUsed'] }, target: { $literal: 7 } } },
      { $sort: { monthNum: 1 } },
    ]);
    res.json(
      data.map((d) => ({
        month: String(d.monthNum).padStart(2, '0'),
        efficiency: Number((d.efficiency || 0).toFixed(2)),
        target: d.target,
      }))
    );
  } catch (err) {
    next(err);
  }
}

async function fleetUtilization(req, res, next) {
  try {
    const tripCounts = await Trip.aggregate([{ $group: { _id: '$vehicle', totalTrips: { $sum: 1 } } }]);
    const vehicles = await Vehicle.find().select('code').lean();
    const map = new Map(tripCounts.map((t) => [t._id.toString(), t.totalTrips]));
    const maxTrips = Math.max(1, ...tripCounts.map((t) => t.totalTrips));
    const result = vehicles.map((v) => ({
      vehicle: v.code,
      utilization: Math.round(((map.get(v._id.toString()) || 0) / maxTrips) * 100),
    }));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { expenseSummary, fuelEfficiency, fleetUtilization };
