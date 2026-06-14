// Password hashing and verification using bcryptjs
const bcrypt = require('bcryptjs')

// Hash a plain-text password
const hashPassword = async (password) => bcrypt.hash(password, 10)

// Compare plain-text password with stored hash
const matchPassword = async (enteredPassword, hashedPassword) =>
  bcrypt.compare(enteredPassword, hashedPassword)

module.exports = { hashPassword, matchPassword }
