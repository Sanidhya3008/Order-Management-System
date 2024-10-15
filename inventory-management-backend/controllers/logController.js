const Log = require('../models/log');

exports.createLog = async (userId, action, details) => {
    try {
        const log = new Log({
            user: userId,
            action,
            details
        });
        await log.save();
        console.log(`Log created: ${action} by user ${userId}`);
    } catch (error) {
        console.error('Error creating log:', error);
    }
};

exports.getLogs = async (req, res) => {
    try {
        const logs = await Log.find().populate('user', 'name email').sort('-createdAt');
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching logs', error: error.message });
    }
};