import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadDir = 'uploads/'
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`)
})

const fileFilter = (req, file, cb) => {
  /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase()) && /jpeg|jpg|png|webp/.test(file.mimetype)
    ? cb(null, true) : cb(new Error('Only images allowed'))
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } })
export default upload
