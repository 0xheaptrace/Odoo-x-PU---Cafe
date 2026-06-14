// Auth routes — public signup and login endpoints
const express = require('express')
const { signup, login, setupAdmin, getSetupStatus } = require('../controllers/authController')

const router = express.Router()

router.get('/setup-status', getSetupStatus)
router.post('/setup-admin', setupAdmin)
router.post('/signup', signup)
router.post('/login', login)

module.exports = router
