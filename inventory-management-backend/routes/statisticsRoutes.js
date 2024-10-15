const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { 
    getLatestStatistics, 
    getOrderTimeSeries, 
    updateStatistics 
} = require('../controllers/statisticsController');

const router = express.Router();

router.get('/latest', protect, authorize('owner'), getLatestStatistics);
router.get('/order-time-series', protect, authorize('owner'), getOrderTimeSeries);
router.post('/update', protect, authorize('owner'), updateStatistics);

module.exports = router;