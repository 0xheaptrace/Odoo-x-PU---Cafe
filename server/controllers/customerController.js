// Customer controller — manage customer records
const prisma = require('../lib/prisma')
const { serializeDoc } = require('../lib/serialize')
const { handleControllerError } = require('../utils/controllerError')

const mapCustomerBody = (body) => ({
  name: body.name?.trim(),
  email: body.email?.trim() || null,
  phone: body.phone?.trim() || null,
})

// Search customers by name or phone
const getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}

    const customers = await prisma.customer.findMany({ where })
    res.status(200).json(customers.map(serializeDoc))
  } catch (error) {
    handleControllerError(res, error, 'getAllCustomers')
  }
}

// Create a new customer
const createCustomer = async (req, res) => {
  try {
    const data = mapCustomerBody(req.body)
    const { name } = data

    if (!name) {
      return res.status(400).json({ message: 'Customer name is required' })
    }

    const customer = await prisma.customer.create({ data })
    res.status(201).json(serializeDoc(customer))
  } catch (error) {
    handleControllerError(res, error, 'createCustomer')
  }
}

// Update an existing customer
const updateCustomer = async (req, res) => {
  try {
    const data = mapCustomerBody(req.body)
    if (!data.name) {
      return res.status(400).json({ message: 'Customer name is required' })
    }

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data,
    })

    res.status(200).json(serializeDoc(customer))
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Customer not found' })
    }
    handleControllerError(res, error, 'updateCustomer')
  }
}

// Delete a customer
const deleteCustomer = async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } })
    res.status(200).json({ message: 'Customer deleted successfully' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Customer not found' })
    }
    handleControllerError(res, error, 'deleteCustomer')
  }
}

module.exports = { getAllCustomers, createCustomer, updateCustomer, deleteCustomer }
