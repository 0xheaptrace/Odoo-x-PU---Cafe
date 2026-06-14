// User controller — CRUD operations for staff accounts
const prisma = require('../lib/prisma')
const { serializeDoc } = require('../lib/serialize')
const { hashPassword } = require('../utils/password')
const { handleControllerError } = require('../utils/controllerError')

// List staff users (admin and employee roles only)
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        isArchived: false,
        role: { in: ['admin', 'employee'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isArchived: true,
        createdAt: true,
      },
    })
    res.status(200).json(users.map(serializeDoc))
  } catch (error) {
    handleControllerError(res, error, 'getAllUsers')
  }
}

// Create a new user with hashed password
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'employee' } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    if (role !== 'employee') {
      return res.status(400).json({ message: 'Only employee accounts can be created here' })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(password),
        role: 'employee',
      },
    })

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  } catch (error) {
    handleControllerError(res, error, 'createUser')
  }
}

// Change password for a specific user
const changePassword = async (req, res) => {
  try {
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ message: 'Password is required' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    await prisma.user.update({
      where: { id: req.params.id },
      data: { password: await hashPassword(password) },
    })

    res.status(200).json({ message: 'Password updated successfully' })
  } catch (error) {
    handleControllerError(res, error, 'changePassword')
  }
}

// Toggle archive status for a user
const archiveUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isArchived: !user.isArchived },
    })

    res.status(200).json({ message: 'User archive status updated', isArchived: updated.isArchived })
  } catch (error) {
    handleControllerError(res, error, 'archiveUser')
  }
}

// Permanently delete a user
const deleteUser = async (req, res) => {
  try {
    const user = await prisma.user.delete({ where: { id: req.params.id } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({ message: 'User deleted successfully' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' })
    }
    handleControllerError(res, error, 'deleteUser')
  }
}

module.exports = { getAllUsers, createUser, changePassword, archiveUser, deleteUser }
