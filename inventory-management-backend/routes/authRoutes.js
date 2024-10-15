const express = require('express');
const { registerByOwner, loginUser, getMe, updateProfile, getAllUsers, deleteUser, updatePassword, registerUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register-by-owner', protect, authorize('owner'), registerByOwner);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.get('/users', protect, authorize('owner'), getAllUsers);
router.delete('/users/:id', protect, authorize('owner'), deleteUser);
router.put('/update-password', protect, updatePassword);
// router.get('/logs', protect, authorize('owner'), getLogs);

module.exports = router;  // Ensure you're exporting the router     