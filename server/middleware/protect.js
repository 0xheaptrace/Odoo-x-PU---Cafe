// JWT authentication middleware — verifies token and attaches user to request
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

const protect = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isArchived: true,
        createdAt: true,
      },
    })

    if (!user || user.isArchived) {
      return res.status(401).json({ message: 'Not authorized, user not found' })
    }

    req.user = { ...user, _id: user.id }
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid' })
  }
}

module.exports = protect
