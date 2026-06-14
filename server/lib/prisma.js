// Prisma Client singleton — shared database connection for the app
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

module.exports = prisma
