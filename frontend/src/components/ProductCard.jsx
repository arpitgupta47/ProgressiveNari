import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { showToast } from './Toast.jsx'

const PLACEHOLDER = 'https://placehold.co/400x300/f0f2f5/ccc?text=No+Image'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { user } = useAuth()

  const handleAddToCart = (e) => {
    e.preventDefault()
    if (!user) {
      showToast('Please login as Customer to add to cart', 'error')
      return
    }
    if (user.role !== 'customer') {
      showToast('Only customers can add items to cart', 'error')
      return
    }
    addToCart(product)
    showToast(`${product.title} added to cart!`, 'success')
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  return (
    <Link to={`/products/${product._id}`} className="card hover:shadow-lg transition-all duration-200 group cursor-pointer">
      <div className="relative overflow-hidden bg-gray-100 h-48">
        <img
          src={product.imageUrl || PLACEHOLDER}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = PLACEHOLDER }}
        />
        {discount && (
          <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
            {discount}% OFF
          </span>
        )}
        <span className="absolute top-2 right-2 badge bg-white/90 text-gray-600 shadow-sm text-xs">
          {product.category}
        </span>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {product.title}
        </h3>

        <p className="text-xs text-muted mt-1 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {product.location || 'India'}
        </p>

        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-lg font-bold text-dark">₹{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted line-through ml-1">₹{product.originalPrice.toLocaleString()}</span>
            )}
          </div>

          {user?.role === 'customer' && (
            <button
              onClick={handleAddToCart}
              className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primaryDark transition-colors active:scale-95"
            >
              Add
            </button>
          )}
        </div>

        <p className="text-xs text-muted mt-1">
          By <span className="text-gray-600 font-medium">{product.seller?.name || 'Seller'}</span>
        </p>
      </div>
    </Link>
  )
}
