// authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'User not found', userDeleted: true });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Middleware to allow only 'owner' (admin) to access specific routes
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'owner') {
        next(); // Proceed if the user is an owner
    } else {
        return res.status(403).json({ message: 'Access denied, not an admin' }); // Stop if not admin
    }
};

// Middleware to allow only 'delivery_person' to access specific routes
const delivery = (req, res, next) => {
    if (req.user && req.user.role === 'delivery_person') {
        next(); // Proceed if user is a delivery person
    } else {
        return res.status(403).json({ message: 'Access denied, not a delivery person' }); // Stop if not delivery
    }
};

// Middleware for flexible role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        // console.log('User role:', req.user.role); // Add this log
        // console.log('Allowed roles:', roles); // Add this log
        if (req.user && roles.includes(req.user.role)) {
            next(); // Proceed if user has one of the authorized roles
        } else {
            return res.status(403).json({ message: 'Access denied, insufficient role' }); // Stop if role not authorized
        }
    };
};

module.exports = { protect, admin, delivery, authorize };
