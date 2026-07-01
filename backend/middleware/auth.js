import jwt from 'jsonwebtoken'

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

export default auth
