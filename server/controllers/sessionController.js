// Session controller — manage POS register sessions
const prisma = require('../lib/prisma')
const { serializeDoc } = require('../lib/serialize')

const sessionInclude = {
  openedBy: { select: { id: true, name: true, email: true } },
}

// Get the currently open session
const getCurrentSession = async (req, res) => {
  try {
    const session = await prisma.session.findFirst({
      where: { isOpen: true },
      include: sessionInclude,
    })

    if (!session) {
      return res.status(404).json({ message: 'No open session found' })
    }

    res.status(200).json(serializeDoc(session))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Open a new POS session
const openSession = async (req, res) => {
  try {
    const existingSession = await prisma.session.findFirst({ where: { isOpen: true } })
    if (existingSession) {
      return res.status(400).json({ message: 'A session is already open' })
    }

    const session = await prisma.session.create({
      data: {
        openedById: req.user.id,
        isOpen: true,
      },
      include: sessionInclude,
    })

    res.status(201).json(serializeDoc(session))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Close the current session and calculate totals
const closeSession = async (req, res) => {
  try {
    const session = await prisma.session.findFirst({ where: { isOpen: true } })
    if (!session) {
      return res.status(404).json({ message: 'No open session found' })
    }

    const paidOrders = await prisma.order.findMany({
      where: { sessionId: session.id, paymentStatus: 'paid' },
    })

    const closingSaleAmount = paidOrders.reduce((sum, order) => sum + order.total, 0)

    const updated = await prisma.session.update({
      where: { id: session.id },
      data: {
        isOpen: false,
        closedAt: new Date(),
        closingSaleAmount,
        totalOrders: paidOrders.length,
      },
      include: sessionInclude,
    })

    res.status(200).json(serializeDoc(updated))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { getCurrentSession, openSession, closeSession }
