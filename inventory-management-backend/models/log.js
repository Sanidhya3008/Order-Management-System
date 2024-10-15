const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    details: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '4d' // This will automatically delete documents older than 4 days
    }
});

module.exports = mongoose.model('Log', logSchema);