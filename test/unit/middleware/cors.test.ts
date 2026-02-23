import { isOriginAllowed } from 'middleware/cors'

describe('isOriginAllowed', () => {
  describe('exact matching', () => {
    it('allows an origin present in the whitelist', () => {
      expect(
        isOriginAllowed('https://savingsatoshi.com', ['https://savingsatoshi.com'])
      ).toBe(true)
    })

    it('rejects an origin not in the whitelist', () => {
      expect(
        isOriginAllowed('https://evil.com', ['https://savingsatoshi.com'])
      ).toBe(false)
    })

    it('allows an origin matching one of multiple exact entries', () => {
      expect(
        isOriginAllowed('https://staging.savingsatoshi.com', [
          'https://savingsatoshi.com',
          'https://staging.savingsatoshi.com',
        ])
      ).toBe(true)
    })
  })

  describe('wildcard matching', () => {
    it('allows an origin matching a wildcard subdomain pattern', () => {
      expect(
        isOriginAllowed('https://my-app.vercel.com', ['https://*.vercel.com'])
      ).toBe(true)
    })

    it('allows any subdomain matching the wildcard', () => {
      expect(
        isOriginAllowed('https://saving-satoshi-abc123.vercel.app', [
          'https://*.vercel.app',
        ])
      ).toBe(true)
    })

    it('rejects an origin with a different domain from the wildcard pattern', () => {
      expect(
        isOriginAllowed('https://evil.com', ['https://*.vercel.com'])
      ).toBe(false)
    })

    it('rejects multiple subdomain levels against a single wildcard', () => {
      expect(
        isOriginAllowed('https://foo.bar.vercel.com', ['https://*.vercel.com'])
      ).toBe(false)
    })

    it('rejects the bare domain when the wildcard pattern requires a subdomain', () => {
      expect(
        isOriginAllowed('https://vercel.com', ['https://*.vercel.com'])
      ).toBe(false)
    })

    it('allows an origin matching a wildcard entry among mixed whitelist entries', () => {
      expect(
        isOriginAllowed('https://preview.vercel.com', [
          'https://savingsatoshi.com',
          'https://*.vercel.com',
        ])
      ).toBe(true)
    })

    it('rejects an origin that does not match any entry in a mixed whitelist', () => {
      expect(
        isOriginAllowed('https://evil.com', [
          'https://savingsatoshi.com',
          'https://*.vercel.com',
        ])
      ).toBe(false)
    })
  })
})
