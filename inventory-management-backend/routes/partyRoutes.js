const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getParties, createParty, updateParty, deleteParty } = require('../controllers/partyController');

const router = express.Router();

router.get('/', protect, getParties);
router.post('/', protect, authorize('owner'), createParty);
router.put('/:id', protect, authorize('owner', 'employee'), updateParty);
router.delete('/:id', protect, authorize('owner', 'employee'), deleteParty);


module.exports = router;