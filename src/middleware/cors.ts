const whitelist = process.env.WHITELIST.split(',').map((a) => a.trim())
const isProd = process.env.ENV === 'production'

export default (req, res, next) => {
  if (isProd && whitelist.indexOf(req.headers.origin) === -1) {
    return res.status(403).json({ error: 'Not in whitelist' })
  }

  res.header('Access-Control-Allow-Origin', req.headers.origin)
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  )
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE')

  next()
}
