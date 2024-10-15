const mongoose = require('mongoose');

const statisticsSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  mostOrderedProduct: { 
    productName: String, 
    orderCount: Number 
  },
  leastOrderedProduct: { 
    productName: String, 
    orderCount: Number 
  },
  numberOfOrders: Number,
  numberOfProducts: Number,
  numberOfParties: Number,
  partyWithMostOrders: { 
    partyName: String, 
    orderCount: Number 
  },
  partyWithLeastOrders: { 
    partyName: String, 
    orderCount: Number 
  },
  productOrderCounts: [{ 
    productName: String, 
    orderCount: Number 
  }],
  averageOrderValue: Number,
  totalRevenue: Number
});

module.exports = mongoose.model('Statistics', statisticsSchema);