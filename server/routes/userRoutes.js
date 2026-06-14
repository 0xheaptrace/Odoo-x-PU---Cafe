// User routes — admin-only staff management
const express = require('express')
const {
  getAllUsers,
  createUser,
  changePassword,
  archiveUser,
  deleteUser,
} = require('../controllers/userController')
const protect = require('../middleware/protect')
const { adminOnly } = require('../middleware/roleGuard')

const router = express.Router()

router.use(protect, adminOnly)

router.get('/', getAllUsers)
router.post('/', createUser)
router.put('/:id/password', changePassword)
router.patch('/:id/password', changePassword)
router.put('/:id/archive', archiveUser)
router.patch('/:id/archive', archiveUser)
router.delete('/:id', deleteUser)

module.exports = router
