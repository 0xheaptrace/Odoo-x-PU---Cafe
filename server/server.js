// Main server entry point — Express + PostgreSQL (Prisma) + Socket.io
require('dotenv').config()

const express = require('express')
const http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')

const prisma = require('./lib/prisma')
const apiRoutes = require('./routes')
const initSocket = require('./socket')

const app = express()
const server = http.createServer(app)

// Socket.io on the same HTTP server, with CORS for the React client
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
})

// Make io accessible in controllers via req.app.get('io')
app.set('io', io)

// Parse JSON request bodies
app.use(express.json())

// Allow requests from the React frontend
app.use(cors({ origin: process.env.CLIENT_URL }))

// Mount all API routes under /api
app.use('/api', apiRoutes)

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.status(200).json({ status: 'ok' })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
})

// Initialize Socket.io event handlers
initSocket(io)

// Start the server with PostgreSQL via Prisma
const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    await prisma.$connect()
    console.log('PostgreSQL connected via Prisma')

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Database connection error:', error.message)
    process.exit(1)
  }
}

startServer()

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
