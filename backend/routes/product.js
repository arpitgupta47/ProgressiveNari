import express from 'express'
import auth from '../middleware/auth.js'
import Product from '../models/Product.js'
import User from '../models/User.js'

const router = express.Router()

// =============================================
// GET ALL PRODUCTS — with LOCATION FILTERING
// =============================================
router.get('/', async (req, res) => {
  try {
    const {
      category, search, minPrice, maxPrice,
      page = 1, limit = 20,
      // Location params from customer
      lat, lng, radius = 50,       // radius in km
      city, pincode, district       // text-based location filter
    } = req.query

    const filter = { isActive: true }

    // Category filter
    if (category && category !== 'all') filter.category = category

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ]
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }

    // ── LOCATION FILTER ──────────────────────────────────────
    // Priority 1: GPS coordinates (most accurate)
    if (lat && lng) {
      const latNum = parseFloat(lat)
      const lngNum = parseFloat(lng)
      const radiusKm = parseFloat(radius)

      // Find sellers within radius
      // 1 degree lat ≈ 111 km
      const latDelta = radiusKm / 111
      const lngDelta = radiusKm / (111 * Math.cos(latNum * Math.PI / 180))

      // Find sellers in radius
      const nearbySellers = await User.find({
        role: 'seller',
        isActive: true,
        latitude: { $gte: latNum - latDelta, $lte: latNum + latDelta },
        longitude: { $gte: lngNum - lngDelta, $lte: lngNum + lngDelta }
      }).select('_id')

      const sellerIds = nearbySellers.map(s => s._id)

      if (sellerIds.length > 0) {
        // Also filter products that have coordinates within range
        filter.$and = filter.$and || []
        filter.$and.push({
          $or: [
            { seller: { $in: sellerIds } },
            {
              latitude: { $gte: latNum - latDelta, $lte: latNum + latDelta },
              longitude: { $gte: lngNum - lngDelta, $lte: lngNum + lngDelta }
            }
          ]
        })
      } else {
        // No sellers found in GPS radius — return empty
        return res.json({ products: [], total: 0, page: Number(page), pages: 0, locationFiltered: true, message: 'No sellers found in your area' })
      }
    }
    // Priority 2: City name filter
    else if (city) {
      filter.city = { $regex: city, $options: 'i' }
    }
    // Priority 3: Pincode filter
    else if (pincode) {
      filter.pincode = pincode
    }
    // Priority 4: District filter
    else if (district) {
      filter.district = { $regex: district, $options: 'i' }
    }
    // No location = show ALL products (default behaviour)
    // ──────────────────────────────────────────────────────────

    const skip = (Number(page) - 1) * Number(limit)
    const total = await Product.countDocuments(filter)
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('seller', 'name email city state latitude longitude')

    res.json({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      locationFiltered: !!(lat && lng) || !!city || !!pincode
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// GET SELLER'S OWN PRODUCTS
router.get('/my-products', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Only sellers can access this.' })
    const products = await Product.find({ seller: req.user.id }).sort({ createdAt: -1 })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// GET SINGLE PRODUCT
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email phone city state latitude longitude upiId')
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// CREATE PRODUCT (seller only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Only sellers can add products.' })
    const { title, description, category, price, stock, imageUrl, location, tags } = req.body

    // Get seller's location to embed in product
    const seller = await User.findById(req.user.id)

    const product = await Product.create({
      title, description, category, price: Number(price), stock: Number(stock) || 1,
      imageUrl: imageUrl || '', location: location || seller?.city || '',
      city: seller?.city || '', state: seller?.state || '',
      district: seller?.district || '', pincode: seller?.pincode || '',
      latitude: seller?.latitude || null, longitude: seller?.longitude || null,
      tags: tags || [], seller: req.user.id
    })
    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// UPDATE PRODUCT
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    if (product.seller.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' })
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// DELETE PRODUCT
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    if (product.seller.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' })
    await product.deleteOne()
    res.json({ message: 'Product removed' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
