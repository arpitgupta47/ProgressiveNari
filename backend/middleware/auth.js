import jwt from 'jsonwebtoken'

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ' )) {
    return res.status(401).json({ message: 'Authorization token missing' })
  }

  const token = authHeader.split(' ' )[1]
  if (!token) {
    return res.status(401).json({ message: 'Authorization token missing' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export default auth
