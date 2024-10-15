const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  party: {
    firmName: { type: String, required: true },
    firmAddress: { type: String, required: true },
    firmCityState: { type: String, required: true },
    contactPerson: { type: String, required: true },
    phoneNumber: { type: String, required: true },
  },
  products: [{
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    status: { type: String, enum: ['ordered', 'shipped'], default: 'ordered' },
    location: { type: String, required: true, default: 'Godown' }, // New field for product location
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
  }],
  status: { 
    type: String, 
    enum: ['pending', 'completed'], 
    default: 'pending'
  },
  //assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Add indexes for frequently queried fields
orderSchema.index({ 'party.firmName': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'products.productName': 1 });

// Add a pre-save hook to update the order status based on product statuses
orderSchema.pre('save', function(next) {
  if (this.isModified('products')) {
    const allShipped = this.products.every(product => product.status === 'shipped');
    this.status = allShipped ? 'completed' : 'pending';
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);