export const setAuthData = (token, user) => {
  localStorage.setItem('pn_token', token)
  localStorage.setItem('pn_user', JSON.stringify(user))
}

export const getToken = () => localStorage.getItem('pn_token')
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem('pn_user')) } catch { return null }
}
export const getUserRole = () => getUser()?.role || null
export const getUserName = () => getUser()?.name || null
export const getUserId = () => getUser()?.id || null
export const isLoggedIn = () => !!getToken()
export const isSeller = () => getUserRole() === 'seller'
export const isCustomer = () => getUserRole() === 'customer'

export const logout = () => {
  localStorage.removeItem('pn_token')
  localStorage.removeItem('pn_user')
  localStorage.removeItem('pn_cart')
}

// Cart
export const getCart = () => {
  try { return JSON.parse(localStorage.getItem('pn_cart')) || [] } catch { return [] }
}
export const setCart = (cart) => localStorage.setItem('pn_cart', JSON.stringify(cart))
export const clearCart = () => localStorage.removeItem('pn_cart')
