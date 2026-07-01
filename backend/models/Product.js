import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true, min: 1 },
  stock: { type: Number, default: 1, min: 0 },
  images: [{ type: String }],
  imageUrl: { type: String, default: '' },
  tags: [{ type: String }],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Location fields (copied from seller at creation time for fast queries)
  location: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  district: { type: String, default: '' },
  pincode: { type: String, default: '' },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },

  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
})

// Text index for search
productSchema.index({ title: 'text', description: 'text', category: 'text' })
// Location index
productSchema.index({ latitude: 1, longitude: 1 })
productSchema.index({ city: 1 })
productSchema.index({ pincode: 1 })

const Product = mongoose.model('Product', productSchema)
export default Product
