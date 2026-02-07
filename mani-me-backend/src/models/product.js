const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  image: String, // URL
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 }, // percent (0-100)
  inStock: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

productSchema.index({ inStock: 1, createdAt: -1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model("Product", productSchema);
