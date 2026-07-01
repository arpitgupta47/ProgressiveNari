import express from 'express'
import auth from '../middleware/auth.js'
import Notification from '../models/Notification.js'

const router = express.Router()

router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(50)
    res.json(notifications)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user.id, isRead: false })
    res.json({ count })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put('/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id }, { isRead: true })
    res.json({ message: 'All marked as read' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true })
    res.json({ message: 'Marked as read' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
