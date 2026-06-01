import express from 'express'
import Joi from 'joi'
import auth from '../middleware/auth.js'
import validate from '../middleware/validate.js'
import upload from '../middleware/upload.js'
import Product from '../models/Product.js'

const router = express.Router()

const productSchema = Joi.object({
  title: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  category: Joi.string().trim().required(),
  price: Joi.number().min(1).required(),
  stock: Joi.number().min(0).default(1),
  location: Joi.string().trim().allow('').optional(),
  tags: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  imageUrl: Joi.string().uri().optional().allow('')
})

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, page = 1, limit = 20 } = req.query
    const filter = { isActive: true }

    if (category && category !== 'all') filter.category = category
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ]
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }

    const skip = (Number(page) - 1) * Number(limit)
    const total = await Product.countDocuments(filter)
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('seller', 'name email location')

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get seller's own products
router.get('/my-products', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can access this.' })
    }
    const products = await Product.find({ seller: req.user.id }).sort({ createdAt: -1 })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email phone location')
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create product (seller only)
router.post('/', auth, validate(productSchema), async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can add products.' })
    }
    const { title, description, category, price, stock, imageUrl, location, tags } = req.body
    const product = await Product.create({
      title, description, category, price, stock: stock || 1,
      imageUrl: imageUrl || '', location, tags: tags || [],
      seller: req.user.id
    })
    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update product
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    await product.deleteOne()
    res.json({ message: 'Product removed successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Upload product image
router.post('/upload-image', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded' })
  const imageUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`
  res.json({ imageUrl })
})

export default router
