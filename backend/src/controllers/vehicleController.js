const Vehicle = require('../models/Vehicle');
const { getNextCode } = require('../utils/generateCodes');

async function list(req, res, next) {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 }).lean();
    res.json(
      vehicles.map((v) => ({
        id: v.code,
        model: v.model,
        type: v.type,
        capacity: `${v.capacityKg} kg`,
        odometer: v.odometerKm,
        status: v.status,
      }))
    );
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { model, type, capacityKg, odometerKm, status, licensePlate, purchaseDate, initialOdometerKm } = req.body;
    const code = await getNextCode(Vehicle, 'VEH');
    const vehicle = await Vehicle.create({
      code,
      model: model || 'Unknown',
      type: type || 'Heavy Truck',
      capacityKg: capacityKg ?? 0,
      odometerKm: odometerKm ?? 0,
      status: status || 'Available',
      licensePlate,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      initialOdometerKm,
    });
    res.status(201).json({
      code: vehicle.code,
      id: vehicle.code,
      model: vehicle.model,
      type: vehicle.type,
      capacityKg: vehicle.capacityKg,
      odometerKm: vehicle.odometerKm,
      status: vehicle.status,
    });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const vehicle = await Vehicle.findOneAndDelete({ code: req.params.id });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, remove };
