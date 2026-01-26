// ======================
// Category Service
// ======================
// Business logic for product categories

const Category = require('../models/category');

/**
 * Get all categories
 * @returns {Promise<Array>} List of categories
 */
const getAllCategories = async () => {
  return await Category.find().sort({ createdAt: -1 });
};

/**
 * Add a new category
 * @param {string} name - Category name
 * @returns {Promise<Object>} Created category
 */
const addCategory = async (name) => {
  if (!name) {
    throw new Error('Category name is required');
  }
  
  const exists = await Category.findOne({ name });
  if (exists) {
    throw new Error('Category already exists');
  }
  
  const category = new Category({ name });
  await category.save();
  return category;
};

/**
 * Update a category
 * @param {string} categoryId - Category ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated category
 */
const updateCategory = async (categoryId, updateData) => {
  const category = await Category.findByIdAndUpdate(categoryId, updateData, { new: true });
  if (!category) {
    throw new Error('Category not found');
  }
  return category;
};

/**
 * Delete a category
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} Deleted category
 */
const deleteCategory = async (categoryId) => {
  const category = await Category.findByIdAndDelete(categoryId);
  if (!category) {
    throw new Error('Category not found');
  }
  return category;
};

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} Category
 */
const getCategoryById = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new Error('Category not found');
  }
  return category;
};

module.exports = {
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
};
