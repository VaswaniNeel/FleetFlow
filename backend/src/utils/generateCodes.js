async function getNextCode(Model, prefix) {
  const last = await Model.findOne().sort({ createdAt: -1 }).select('code').lean();
  if (!last || !last.code) {
    return `${prefix}-001`;
  }
  const match = last.code.match(new RegExp(`${prefix}-(\\d+)`));
  const num = match ? parseInt(match[1], 10) + 1 : 1;
  return `${prefix}-${String(num).padStart(3, '0')}`;
}

module.exports = { getNextCode };
