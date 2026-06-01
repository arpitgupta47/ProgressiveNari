import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true, min: 1 },
  stock: { type: Number, default: 1, min: 0 },
  images: [{ type: String }],
  imageUrl: { type: String, default: '' },
  location: { type: String, default: '' },
  tags: [{ type: String }],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
})

const Product = mongoose.model('Product', productSchema)
export default Product
