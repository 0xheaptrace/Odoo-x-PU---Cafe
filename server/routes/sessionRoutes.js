// Session routes — POS register open/close
const express = require('express')
const {
  getCurrentSession,
  openSession,
  closeSession,
} = require('../controllers/sessionController')
const protect = require('../middleware/protect')
const { employeeOrAdmin } = require('../middleware/roleGuard')

const router = express.Router()

router.use(protect, employeeOrAdmin)

router.get('/current', getCurrentSession)
router.post('/open', openSession)
router.post('/close', closeSession)

module.exports = router
