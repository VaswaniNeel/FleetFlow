const Driver = require('../models/Driver');
const { getNextCode } = require('../utils/generateCodes');

async function list(req, res, next) {
  try {
    const drivers = await Driver.find().sort({ name: 1 }).lean();
    res.json(
      drivers.map((d) => ({
        id: d.code,
        name: d.name,
        license: d.licenseNumber,
        expiry: d.licenseExpiry,
        completionRate: d.completionRate ?? 0,
        safetyScore: d.safetyScore ?? 0,
        status: d.status,
      }))
    );
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, licenseNumber, licenseType, licenseExpiry, email, phone, status } = req.body;
    const code = await getNextCode(Driver, 'DRV');
    const driver = await Driver.create({
      code,
      name: name || 'Unknown',
      licenseNumber: licenseNumber || '',
      licenseType: licenseType || 'CDL-A',
      licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : new Date(),
      email,
      phone,
      status: status || 'Active',
    });
    res.status(201).json({
      code: driver.code,
      id: driver.code,
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
      completionRate: driver.completionRate,
      safetyScore: driver.safetyScore,
      status: driver.status,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create };
