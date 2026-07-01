import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, default: '' },
  role: { type: String, enum: ['seller', 'customer', 'delivery', 'admin'], required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  gender: { type: String, enum: ['female', 'male', 'other', ''], default: '' },
  googleId: { type: String, default: '' },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  avatar: { type: String, default: '' },

  // Seller fields
  bankAccount: { type: String, default: '' },
  ifscCode: { type: String, default: '' },
  upiId: { type: String, default: '' },

  // Seller location (for location-based filtering)
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  district: { type: String, default: '' },
  pincode: { type: String, default: '' },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },

  // Delivery boy fields
  vehicleType: { type: String, enum: ['bike', 'cycle', 'scooter', 'van', ''], default: '' },
  vehicleNumber: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  currentLatitude: { type: Number, default: null },
  currentLongitude: { type: Number, default: null },
  deliveryZone: { type: String, default: '' },
  totalDeliveries: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0 },

  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
})

// 2dsphere index for location-based queries
userSchema.index({ latitude: 1, longitude: 1 })
userSchema.index({ currentLatitude: 1, currentLongitude: 1 })

const User = mongoose.model('User', userSchema)
export default User
