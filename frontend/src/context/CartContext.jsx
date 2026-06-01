import { createContext, useContext, useState, useEffect } from 'react'
import { getCart, setCart as saveCart } from '../utils/auth.js'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCartState] = useState(getCart())

  const syncCart = (updated) => {
    setCartState(updated)
    saveCart(updated)
  }

  const addToCart = (product, quantity = 1) => {
    const existing = cart.find(i => i._id === product._id)
    const updated = existing
      ? cart.map(i => i._id === product._id ? { ...i, quantity: i.quantity + quantity } : i)
      : [...cart, { ...product, quantity }]
    syncCart(updated)
    return true
  }

  const removeFromCart = (id) => syncCart(cart.filter(i => i._id !== id))

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) return removeFromCart(id)
    syncCart(cart.map(i => i._id === id ? { ...i, quantity } : i))
  }

  const clearCart = () => syncCart([])

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
