// Role-based access control middleware
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied — admin only' })
  }
  next()
}

const employeeOrAdmin = (req, res, next) => {
  if (!['admin', 'employee'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Access denied — employee or admin only' })
  }
  next()
}

module.exports = { adminOnly, employeeOrAdmin }
