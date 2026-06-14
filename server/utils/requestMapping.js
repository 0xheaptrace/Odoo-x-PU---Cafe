const getId = (value) => {
  if (value === null || value === undefined || value === '') return value
  if (typeof value === 'object') return value.id || value._id
  return value
}

const pickDefined = (body, fields) =>
  fields.reduce((data, field) => {
    if (body[field] !== undefined) data[field] = body[field]
    return data
  }, {})

module.exports = { getId, pickDefined }
