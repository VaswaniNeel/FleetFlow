const express = require('express');
const auth = require('../middleware/auth');
const { list, create } = require('../controllers/maintenanceController');

const router = express.Router();
router.use(auth);

router.get('/', list);
router.post('/', create);

module.exports = router;
