import { WHITELIST } from 'config'

const isProd = process.env.NODE_ENV === 'production'

export function isOriginAllowed(origin: string, whitelist: string[]): boolean {
  return whitelist.some(entry => {
    if (!entry.includes('*')) {
      return entry === origin
    }
    const pattern = entry
      // Escape all regex special characters so literal dots, slashes, etc.
      // in the whitelist entry (e.g. "https://") are matched exactly.
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      // Replace each '*' with a pattern that matches one or more characters
      // that are not a dot, so a single wildcard covers exactly one subdomain
      // segment (e.g. "https://*.vercel.com" matches "https://foo.vercel.com"
      // but not "https://foo.bar.vercel.com" or "https://vercel.com").
      .replace(/\*/g, '[^.]+')
    return new RegExp(`^${pattern}$`).test(origin)
  })
}

export default (req, res, next) => {
  if (isProd && !isOriginAllowed(req.headers.origin, WHITELIST)) {
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
