// Auth controller — handles signup and login
const prisma = require('../lib/prisma')
const generateToken = require('../utils/generateToken')
const { hashPassword, matchPassword } = require('../utils/password')

const formatUserResponse = (user, customerId = null) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  ...(customerId ? { customerId } : {}),
})

const ensureCustomerProfile = async (user) => {
  let customer = await prisma.customer.findFirst({
    where: { email: user.email },
  })

  if (!customer) {
    customer = await prisma.customer.create({
      data: { name: user.name, email: user.email },
    })
  }

  return customer.id
}

// Register a new customer account and return JWT token
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(password),
        role: 'customer',
      },
    })

    const customerId = await ensureCustomerProfile(user)

    res.status(201).json({
      token: generateToken(user.id),
      user: formatUserResponse(user, customerId),
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// One-time admin setup when no admin account exists yet
const setupAdmin = async (req, res) => {
  try {
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'admin' } })
    if (existingAdmin) {
      return res.status(403).json({ message: 'Admin account already exists' })
    }

    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(password),
        role: 'admin',
      },
    })

    res.status(201).json({
      token: generateToken(user.id),
      user: formatUserResponse(user),
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Check whether initial admin setup is still required
const getSetupStatus = async (req, res) => {
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
    res.status(200).json({ needsSetup: !admin })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Authenticate user with email and password
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.isArchived) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await matchPassword(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    let customerId = null
    if (user.role === 'customer') {
      customerId = await ensureCustomerProfile(user)
    }

    res.status(200).json({
      token: generateToken(user.id),
      user: formatUserResponse(user, customerId),
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { signup, login, setupAdmin, getSetupStatus }
