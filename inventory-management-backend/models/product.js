const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    netStock: { type: Number, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);