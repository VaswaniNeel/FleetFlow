const express = require('express');
const authRoutes = require('./authRoutes');
const vehicleRoutes = require('./vehicleRoutes');
const driverRoutes = require('./driverRoutes');
const tripRoutes = require('./tripRoutes');
const maintenanceRoutes = require('./maintenanceRoutes');
const analyticsRoutes = require('./analyticsRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/trips', tripRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
