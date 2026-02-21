const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const { getNextCode } = require('../utils/generateCodes');

async function list(req, res, next) {
  try {
    const trips = await Trip.find()
      .populate('vehicle', 'code model')
      .populate('driver', 'code name')
      .sort({ createdAt: -1 })
      .lean();
    res.json(
      trips.map((t) => ({
        id: t.code,
        vehicleId: t.vehicle?.code,
        vehicle: t.vehicle?.model,
        driverId: t.driver?.code,
        driver: t.driver?.name,
        route: `${t.origin} → ${t.destination}`,
        cargoWeight: t.cargoWeightKg,
        status: t.status,
        scheduledAt: t.scheduledAt,
        onTime: t.onTime,
        distance: t.distanceKm,
        fuelUsed: t.fuelUsedLiters,
        fuelCost: t.fuelCost,
      }))
    );
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { vehicleCode, driverCode, cargoWeightKg, origin, destination, estimatedFuelCost, status, scheduledAt } = req.body;
    const vehicle = await Vehicle.findOne({ code: vehicleCode });
    const driver = await Driver.findOne({ code: driverCode });
    if (!vehicle) return res.status(400).json({ message: 'Invalid vehicle code' });
    if (!driver) return res.status(400).json({ message: 'Invalid driver code' });
    if (vehicle.status !== 'Available') return res.status(400).json({ message: 'Vehicle is not available for dispatch' });
    if (driver.status !== 'Active') return res.status(400).json({ message: 'Driver is not available for dispatch' });
    const code = await getNextCode(Trip, 'TRP');
    const tripStatus = status || 'Dispatched';
    const trip = await Trip.create({
      code,
      vehicle: vehicle._id,
      driver: driver._id,
      cargoWeightKg: cargoWeightKg ?? 0,
      origin: origin || '',
      destination: destination || '',
      estimatedFuelCost: estimatedFuelCost ?? 0,
      status: tripStatus,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    });
    if (tripStatus === 'Dispatched') {
      await Vehicle.findByIdAndUpdate(vehicle._id, { status: 'On Trip' });
      await Driver.findByIdAndUpdate(driver._id, { status: 'On Leave' });
    }
    const populated = await Trip.findById(trip._id).populate('vehicle', 'code model').populate('driver', 'code name').lean();
    res.status(201).json({
      code: populated.code,
      id: populated.code,
      vehicleId: populated.vehicle?.code,
      vehicle: populated.vehicle?.model,
      driverId: populated.driver?.code,
      driver: populated.driver?.name,
      route: `${populated.origin} → ${populated.destination}`,
      cargoWeight: populated.cargoWeightKg,
      status: populated.status,
      scheduledAt: populated.scheduledAt,
      onTime: populated.onTime,
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { code } = req.params;
    const { status } = req.body;
    const trip = await Trip.findOne({ code }).populate('vehicle').populate('driver');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (!['Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Only Completed or Cancelled status can be set' });
    }
    const previousStatus = trip.status;
    trip.status = status;
    await trip.save();
    if (previousStatus === 'Dispatched' && (status === 'Completed' || status === 'Cancelled')) {
      await Vehicle.findByIdAndUpdate(trip.vehicle._id, { status: 'Available' });
      await Driver.findByIdAndUpdate(trip.driver._id, { status: 'Active' });
    }
    const populated = await Trip.findById(trip._id).populate('vehicle', 'code model').populate('driver', 'code name').lean();
    res.json({
      id: populated.code,
      vehicleId: populated.vehicle?.code,
      vehicle: populated.vehicle?.model,
      driverId: populated.driver?.code,
      driver: populated.driver?.name,
      route: `${populated.origin} → ${populated.destination}`,
      cargoWeight: populated.cargoWeightKg,
      status: populated.status,
      scheduledAt: populated.scheduledAt,
      onTime: populated.onTime,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update };
