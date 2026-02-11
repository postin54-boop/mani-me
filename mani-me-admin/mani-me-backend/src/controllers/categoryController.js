// ======================
// Category Controller
// ======================
const categoryService = require('../services/categoryService');

exports.getCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

exports.addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await categoryService.addCategory(name);
    res.status(201).json(category);
  } catch (err) {
    if (err.message === 'Category name is required') {
      return res.status(400).json({ message: err.message });
    }
    if (err.message === 'Category already exists') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error adding category' });
  }
};
