import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, default: '' }, // empty for Google OAuth users
  role: { type: String, enum: ['seller', 'customer', 'admin', 'delivery_person'], required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },

  // Gender verification for sellers
  gender: { type: String, enum: ['female', 'male', 'other', ''], default: '' },
  genderVerified: { type: Boolean, default: false },

  // Google OAuth
  googleId: { type: String, default: '' },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  avatar: { type: String, default: '' },

  // Seller bank details for payouts
  bankAccount: { type: String, default: '' },
  ifscCode: { type: String, default: '' },
  upiId: { type: String, default: '' },
  razorpayContactId: { type: String, default: '' },
  razorpayFundAccountId: { type: String, default: '' },

  // Delivery Person details
  deliveryPersonVehicle: { type: String, enum: ['bike', 'scooter', 'bicycle', 'auto', 'car', ''], default: '' },
  deliveryPersonDocumentId: { type: String, default: '' },
  deliveryPersonVerified: { type: Boolean, default: false },
  deliveryPersonZones: [{ type: String }], // Cities/zones they deliver in
  deliveryPersonRating: { type: Number, default: 0 },
  deliveryPersonOrders: { type: Number, default: 0 },

  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema)
export default User
