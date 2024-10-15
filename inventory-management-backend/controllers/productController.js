const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { createLog } = require('./logController');

exports.createProduct = async (req, res) => {
  const { productName, description, netStock } = req.body;
  try {
    const existingProduct = await Product.findOne({ productName });
    if (existingProduct) {
      return res.status(400).json({ message: 'A product with this name already exists' });
    }
    
    const product = new Product({ 
      productName,
      description: description || null,
      netStock: netStock || null
    });
    const savedProduct = await product.save();
    await createLog(req.user.id, 'Create Product', `Product created: ${productName}`);
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { description, netStock } = req.body;
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { description, netStock },
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  try {
    // Verify owner's password
    const owner = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Remove the product from all orders
    await Order.updateMany(
      { 'products.productName': deletedProduct.productName },
      { $pull: { products: { productName: deletedProduct.productName } } }
    );
    
    await createLog(req.user.id, 'Delete Product', `Product Id Deleted: ${deletedProduct.productName}`);
    res.json({ message: 'Product deleted successfully and removed from all orders' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};