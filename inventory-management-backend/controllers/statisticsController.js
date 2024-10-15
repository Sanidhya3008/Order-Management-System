const Statistics = require('../models/statistics');
const Order = require('../models/order');
const Product = require('../models/product');
const Party = require('../models/party');

const initializeStatistics = async () => {
    const existingStats = await Statistics.findOne();
    if (existingStats) {
        console.log('Statistics already initialized');
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const initialStats = new Statistics({
        date: today,
        mostOrderedProduct: { productName: 'N/A', orderCount: 0 },
        leastOrderedProduct: { productName: 'N/A', orderCount: 0 },
        numberOfOrders: 0,
        numberOfProducts: 0,
        numberOfParties: 0,
        partyWithMostOrders: { partyName: 'N/A', orderCount: 0 },
        partyWithLeastOrders: { partyName: 'N/A', orderCount: 0 },
        productOrderCounts: [],
        averageOrderValue: 0,
        totalRevenue: 0
    });

    await initialStats.save();
    console.log('Initial statistics created:', initialStats);
};


exports.getLatestStatistics = async (req, res) => {
    try {
        const latestStats = await Statistics.findOne().sort({ date: -1 });
        if (!latestStats) {
            return res.status(404).json({ message: 'No statistics available' });
        }
        res.json(latestStats);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ message: 'Error fetching statistics', error: error.message });
    }
};

exports.getOrderTimeSeries = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const orderCounts = await Order.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { 
                $group: { 
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                    count: { $sum: 1 } 
                } 
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(orderCounts);
    } catch (error) {
        console.error('Error fetching order time series:', error);
        res.status(500).json({ message: 'Error fetching order time series', error: error.message });
    }
};

exports.updateStatistics = async (req, res) => {
    try {
        const stats = await calculateStatistics();
        res.json({ message: 'Statistics updated successfully', statistics: stats });
    } catch (error) {
        console.error('Error updating statistics:', error);
        res.status(500).json({ message: 'Error updating statistics', error: error.message });
    }
};

const calculateStatistics = async () => {
    try {
        // Fetch all orders, products, and parties
        const orders = await Order.find().populate('party').populate('products.assignedTo');
        const products = await Product.find();
        const parties = await Party.find();

        const productOrderCounts = {};
        const partyOrderCounts = {};
        let totalOrderValue = 0;

        orders.forEach(order => {
            if (order.party) {
                partyOrderCounts[order.party.firmName] = (partyOrderCounts[order.party.firmName] || 0) + 1;
            }
            
            order.products.forEach(product => {
                const productKey = product.productName;
                productOrderCounts[productKey] = (productOrderCounts[productKey] || 0) + 1;
                totalOrderValue += product.quantity * product.rate;
            });
        });

        const sortedProducts = Object.entries(productOrderCounts).sort((a, b) => b[1] - a[1]);
        const sortedParties = Object.entries(partyOrderCounts).sort((a, b) => b[1] - a[1]);

        const statisticsData = {
            date: new Date(),  // Current date
            mostOrderedProduct: sortedProducts[0] ? { productName: sortedProducts[0][0], orderCount: sortedProducts[0][1] } : null,
            leastOrderedProduct: sortedProducts[sortedProducts.length - 1] ? { productName: sortedProducts[sortedProducts.length - 1][0], orderCount: sortedProducts[sortedProducts.length - 1][1] } : null,
            numberOfOrders: orders.length,
            numberOfProducts: products.length,
            numberOfParties: parties.length,
            partyWithMostOrders: sortedParties[0] ? { partyName: sortedParties[0][0], orderCount: sortedParties[0][1] } : null,
            partyWithLeastOrders: sortedParties[sortedParties.length - 1] ? { partyName: sortedParties[sortedParties.length - 1][0], orderCount: sortedParties[sortedParties.length - 1][1] } : null,
            productOrderCounts: sortedProducts.map(([productName, orderCount]) => ({ productName, orderCount })),
            averageOrderValue: orders.length > 0 ? totalOrderValue / orders.length : 0,
            totalRevenue: totalOrderValue
        };

        const updatedStats = await Statistics.findOneAndUpdate(
            { date: { $gte: new Date().setHours(0, 0, 0, 0) } },  // Find today's statistics
            statisticsData,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        //console.log('Statistics updated successfully:', updatedStats);
        return updatedStats;
    } catch (error) {
        console.error('Error calculating statistics:', error);
        throw error;
    }
};

module.exports = {
    initializeStatistics,
    getLatestStatistics: exports.getLatestStatistics,
    updateStatistics: exports.updateStatistics,
    getOrderTimeSeries: exports.getOrderTimeSeries
};