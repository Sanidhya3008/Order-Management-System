const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');

const router = express.Router();

router.get('/', protect, authorize('owner', 'employee'), getProducts);
router.post('/', protect, authorize('owner'), createProduct);
router.put('/:id', protect, authorize('owner', 'employee'), updateProduct);
router.delete('/:id', protect, authorize('owner'), deleteProduct);

module.exports = router;