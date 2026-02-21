const express = require('express');
const auth = require('../middleware/auth');
const { list, create, remove } = require('../controllers/vehicleController');

const router = express.Router();
router.use(auth);

router.get('/', list);
router.post('/', create);
router.delete('/:id', remove);

module.exports = router;
