const Order = require('../models/order');
const mongoose = require('mongoose');
const Party = require('../models/party'); // Assuming you have a Party model
const { createLog } = require('./logController');

exports.getOrders = async (req, res) => {
    try {
        let orders;
        if (req.user.role === 'delivery_person') {
            orders = await Order.find({ 'products.assignedTo': req.user.id })
                .populate('createdBy', 'name')
                .populate('products.assignedTo', 'name');
        } else if (req.user.role === 'employee') {
            const pipeline = [
                {
                    $match: req.user.location === 'Universal' ? {} : {
                        'products.location': req.user.location
                    }
                },
                {
                    $addFields: {
                        filteredProducts: {
                            $filter: {
                                input: '$products',
                                as: 'product',
                                cond: {
                                    $or: [
                                        { $eq: [req.user.location, 'Universal'] },
                                        { $eq: ['$$product.location', req.user.location] }
                                    ]
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        party: 1,
                        status: 1,
                        createdBy: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        products: '$filteredProducts'
                    }
                },
                {
                    $match: {
                        'products': { $ne: [] }
                    }
                }
            ];

            orders = await Order.aggregate(pipeline);

            // Populate after aggregation
            await Order.populate(orders, [
                { path: 'createdBy', select: 'name' },
                { path: 'products.assignedTo', select: 'name' }
            ]);
        } else {
            // For owner role
            orders = await Order.find()
                .populate('createdBy', 'name')
                .populate('products.assignedTo', 'name');
        }

        //console.log('Filtered orders:', JSON.stringify(orders, null, 2));

        res.json(orders);
    } catch (error) {
        console.error('Error in getOrders:', error);
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        let order = await Order.findById(req.params.id)
            .populate('createdBy', 'name')
            .populate('products.assignedTo', 'name');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (req.user.role === 'employee' && req.user.location !== 'Universal') {
            order = order.toObject(); // Convert to a plain JavaScript object
            order.products = order.products.filter(product => 
                product.location === req.user.location
            );
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ message: 'Error fetching order', error: error.message });
    }
};

exports.completeOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (req.user.role === 'employee' && req.user.location !== 'Universal') {
            const relevantProducts = order.products.filter(product => product.location === req.user.location);
            const allRelevantProductsShipped = relevantProducts.every(product => product.status === 'shipped');

            if (!allRelevantProductsShipped) {
                return res.status(400).json({ message: 'Not all relevant products are shipped' });
            }

            order.products.forEach(product => {
                if (product.location === req.user.location) {
                    product.status = 'shipped';
                }
            });
        } else {
            order.status = 'completed';
            order.products.forEach(product => {
                product.status = 'shipped';
            });
        }
        
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        console.error('Error completing order:', error);
        res.status(500).json({ message: 'Error completing order', error: error.message });
    }
};

exports.pendingOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (req.user.role === 'employee' && req.user.location !== 'Universal') {
            order.status = 'pending';
            order.products.forEach(product => {
                if (product.location === req.user.location) {
                    product.status = 'ordered';
                }
            });
        } else {
            order.status = 'pending';
            order.products.forEach(product => {
                product.status = 'ordered';
            });
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        console.error('Error setting order to pending:', error);
        res.status(500).json({ message: 'Error setting order to pending', error: error.message });
    }
};

exports.getAssignedDeliveries = async (req, res) => {
    try {
        const deliveryPersonId = req.user.id;

        const orders = await Order.aggregate([
            {
                $match: {
                    'products.assignedTo': new mongoose.Types.ObjectId(deliveryPersonId)
                }
            },
            {
                $addFields: {
                    assignedProducts: {
                        $filter: {
                            input: '$products',
                            as: 'product',
                            cond: { $eq: ['$$product.assignedTo', new mongoose.Types.ObjectId(deliveryPersonId)] }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    party: 1,
                    status: 1,
                    createdAt: 1,
                    products: '$assignedProducts'
                }
            }
        ]);

        await Order.populate(orders, [
            { path: 'products.assignedTo', select: 'name' }
        ]);

        const pendingOrders = orders.filter(order => 
            order.products.some(product => product.status === 'ordered')
        );

        const completedOrders = orders.filter(order => 
            order.products.every(product => product.status === 'shipped')
        );

        res.json({
            pending: pendingOrders,
            completed: completedOrders
        });
    } catch (error) {
        console.error('Error in getAssignedDeliveries:', error);
        res.status(500).json({ message: 'Error fetching assigned deliveries', error: error.message });
    }
};

exports.createOrder = async (req, res) => {
    const { party, products } = req.body;

    const productsWithDefaults = products.map(product => ({
            ...product,
            location: product.location || 'Godown',
            assignedTo: product.assignedTo || null
    }));

    //console.log('Processed products:', productsWithDefaults);

    try {
        const order = new Order({
            party,
            products: productsWithDefaults,
            status: 'pending',
            createdBy: req.user.id
        });

        //console.log('Order to be saved:', order);
        const savedOrder = await order.save();
        await createLog(req.user.id, 'Create Order', `Order created with ID: ${savedOrder._id}`);
        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
};

exports.shipProduct = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const { productName, quantity, rate, location } = req.body;
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const productIndex = order.products.findIndex(p => 
            p._id.toString() === productId &&
            p.productName === productName &&
            p.quantity === Number(quantity) &&
            p.rate === Number(rate) &&
            p.location === location
        );

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found in this order' });
        }

        if (req.user.role === 'employee' && req.user.location !== 'Universal' && order.products[productIndex].location !== req.user.location) {
            return res.status(403).json({ message: 'You are not authorized to ship this product' });
        }

        order.products[productIndex].status = 'shipped';
        
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        console.error('Error shipping product:', error);
        res.status(500).json({ message: 'Error shipping product', error: error.message });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending orders can be edited' });
        }

        // If party is being updated and it's an ID, fetch the full party details
        if (updates.party && mongoose.Types.ObjectId.isValid(updates.party)) {
            const party = await Party.findById(updates.party);
            if (!party) {
                return res.status(404).json({ message: 'Party not found' });
            }
            updates.party = {
                firmName: party.firmName,
                firmAddress: party.firmAddress,
                firmCityState: party.firmCityState,
                contactPerson: party.contactPerson,
                phoneNumber: party.phoneNumber
            };
        }

        // Ensure products are properly formatted
        if (updates.products) {
            updates.products = updates.products.map(p => ({
                ...p,
                quantity: Number(p.quantity),
                rate: Number(p.rate),
                location: p.location || 'Godown',
                assignedTo: p.assignedTo || null
            }));
        }

        Object.assign(order, updates);

        // Update the createdBy field to reflect the editor
        order.createdBy = req.user.id;

        //console.log('Updated order before save:', JSON.stringify(order.toObject(), null, 2));

        const updatedOrder = await order.save();
        await createLog(req.user.id, 'Update Order', `Order updated with ID: ${id}`);
        res.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: 'Error updating order', error: error.message, stack: error.stack });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending orders can be deleted' });
        }

        await Order.findByIdAndDelete(id);
        await createLog(req.user.id, 'Delete Order', `Order deleted with ID: ${id}`);
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ message: 'Error deleting order', error: error.message });
    }
};

exports.getPendingOrdersByParty = async (req, res) => {
    try {
        const { partyName } = req.params;
        
        let orders = await Order.find({
            'party.firmName': partyName,
            status: 'pending'
        }).sort({ createdAt: -1 })
          .populate('createdBy', 'name')
          .populate('products.assignedTo', 'name');

        if (req.user.role === 'employee' && req.user.location !== 'Universal') {
            orders = orders.map(order => {
                order = order.toObject();
                order.products = order.products.filter(product => 
                    product.location === req.user.location
                );
                return order;
            });
        }

        res.json(orders);
    } catch (error) {
        console.error('Error fetching pending orders by party:', error);
        res.status(500).json({ message: 'Error fetching pending orders', error: error.message });
    }
};