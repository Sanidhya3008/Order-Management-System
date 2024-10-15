const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/user');

const router = express.Router();

router.get('/delivery-persons', protect, async (req, res) => {
    try {
        const deliveryPersons = await User.find({ role: 'delivery_person' }).select('name _id');
        res.json(deliveryPersons);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching delivery persons', error: error.message });
    }
});

module.exports = router;