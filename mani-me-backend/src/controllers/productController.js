/**
 * Product Controller
 * @module controllers/productController
 */

const Product = require('../models/product');
const { escapeRegex } = require('../utils/sanitize');
const logger = require('../utils/logger');

exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    let query = {};
    if (req.query.search) {
      const safeSearch = escapeRegex(req.query.search);
      query.name = { $regex: safeSearch, $options: 'i' };
    }
    if (req.query.category) query.category = req.query.category;
    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(query)
    ]);
    res.json({ products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    logger.error('Error fetching products', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    logger.error('Error creating product', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    logger.error('Error updating product', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    logger.error('Error deleting product', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};
