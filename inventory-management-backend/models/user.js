const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['owner', 'employee', 'delivery_person'],
        default: 'employee'
    },
    location: { 
        type: String, 
        enum: ['Mill', 'Godown', 'Universal'],
        required: function() { return this.role === 'employee'; }
    },
    lastLogin: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);