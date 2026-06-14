// Payment settings controller — manage accepted payment methods
const prisma = require('../lib/prisma')
const { serializeDoc } = require('../lib/serialize')
const { pickDefined } = require('../utils/requestMapping')

const mapPaymentSettingsBody = (body) =>
  pickDefined(body, ['cash', 'card', 'upi', 'upiId'])

// Get current payment settings, creating defaults if none exist
const getPaymentSettings = async (req, res) => {
  try {
    let settings = await prisma.paymentSettings.findFirst()
    if (!settings) {
      settings = await prisma.paymentSettings.create({ data: {} })
    }
    res.status(200).json(serializeDoc(settings))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Update payment method toggles and UPI ID
const updatePaymentSettings = async (req, res) => {
  try {
    const data = mapPaymentSettingsBody(req.body)
    let settings = await prisma.paymentSettings.findFirst()
    if (!settings) {
      settings = await prisma.paymentSettings.create({ data })
    } else {
      settings = await prisma.paymentSettings.update({
        where: { id: settings.id },
        data,
      })
    }

    res.status(200).json(serializeDoc(settings))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { getPaymentSettings, updatePaymentSettings }
