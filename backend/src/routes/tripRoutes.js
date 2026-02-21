const express = require('express');
const auth = require('../middleware/auth');
const { list, create, update } = require('../controllers/tripController');

const router = express.Router();
router.use(auth);

router.get('/', list);
router.post('/', create);
router.patch('/:code', update);

module.exports = router;
