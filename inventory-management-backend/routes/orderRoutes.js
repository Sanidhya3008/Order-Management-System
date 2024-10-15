const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getOrders,
    createOrder,
    getAssignedDeliveries,
    getOrderById, 
    shipProduct, 
    completeOrder, 
    pendingOrder,
    updateOrder,
    deleteOrder,
    getPendingOrdersByParty
} = require('../controllers/orderController');

const router = express.Router();

router.get('/', protect, getOrders);
router.post('/create', protect, authorize('employee', 'owner'), createOrder);
router.get('/assigned-deliveries', protect, authorize('delivery_person'), getAssignedDeliveries);
router.get('/:id', protect, getOrderById);
router.put('/complete/:id', protect, authorize('owner', 'employee'), completeOrder);
router.put('/pending/:id', protect, authorize('owner', 'employee'), pendingOrder);
router.put('/:orderId/ship-product/:productId', protect, authorize('owner', 'employee'), shipProduct);
router.put('/:id', protect, authorize('owner', 'employee'), updateOrder);
router.delete('/:id', protect, authorize('owner', 'employee'), deleteOrder);
router.get('/pending-by-party/:partyName', protect, getPendingOrdersByParty);

module.exports = router;