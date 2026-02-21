const express = require('express');
const auth = require('../middleware/auth');
const { expenseSummary, fuelEfficiency, fleetUtilization } = require('../controllers/analyticsController');

const router = express.Router();
router.use(auth);

router.get('/expenses', expenseSummary);
router.get('/fuel-efficiency', fuelEfficiency);
router.get('/fleet-utilization', fleetUtilization);

module.exports = router;
