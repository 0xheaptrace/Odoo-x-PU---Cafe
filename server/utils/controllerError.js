const getClientMessage = (error) => {
  if (!error) return 'Server error'

  if (error.code === 'P2002') {
    const target = Array.isArray(error.meta?.target)
      ? error.meta.target.join(', ')
      : error.meta?.target
    return target ? `Duplicate value for ${target}` : 'Duplicate value'
  }

  if (error.code === 'P2003') {
    return 'Related record was not found. Please check the selected IDs.'
  }

  if (error.code === 'P2025') {
    return 'Record not found'
  }

  return error.message || 'Server error'
}

const handleControllerError = (res, error, context) => {
  const message = getClientMessage(error)

  console.error(`[${context}]`, {
    message: error?.message,
    code: error?.code,
    meta: error?.meta,
    stack: error?.stack,
  })

  res.status(500).json({
    message,
    error: error?.message || message,
    code: error?.code,
  })
}

module.exports = { handleControllerError }
