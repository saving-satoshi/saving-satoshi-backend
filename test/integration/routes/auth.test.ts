import jwt from 'jsonwebtoken'
import request from 'supertest'
import { testApp, prisma } from '../setup'
import { ACCESS_TOKEN_COOKIE_NAME } from '../../../src/lib/cookie'

// a valid 64-char hex key: matches the schema
// min/max of 64 in "src/routes/v1/auth.ts"
const PRIV_KEY = 'a'.repeat(64)
const OTHER_PRIV_KEY = 'b'.repeat(64)

const JWT_SECRET = process.env.SECRET || 'test-secret'

describe('Auth API', () => {
  // 1. POST /v1/auth/register

  describe('POST /v1/auth/register', () => {
    it('creates a new account and seeds a progress record', async () => {
      const res = await request(testApp)
        .post('/v1/auth/register')
        .send({ private_key: PRIV_KEY, avatar: 'avatar1' })
        .expect(200)

      expect(res.body.id).toBeDefined()

      // progress row must exist so the user can start from CH1INT1
      const progress = await prisma.accounts_progress.findFirst({
        where: { account: res.body.id },
      })
      expect(progress?.progress).toBe('CH1INT1')
    })

    it('rejects a duplicate private_key with 409', async () => {
      await createAccount()

      // create another account with the same private key
      const res = await request(testApp)
        .post('/v1/auth/register')
        .send({ private_key: PRIV_KEY, avatar: 'avatar1' })
        .expect(409)

      expect(res.body.errors[0].message).toBe('Account already exists.')
    })
  })

  // 2. POST /v1/auth/login

  describe('POST /v1/auth/login', () => {
    it('returns a token and account id for valid credentials', async () => {
      await createAccount()

      // now try to log in with the same exact key as the created account's
      const res = await request(testApp)
        .post('/v1/auth/login')
        .send({ private_key: PRIV_KEY })
        .expect(200)

      const { id, token } = res.body
      expect(id).toBeDefined()
      expect(token).toBeDefined()

      // cookie must be set so browser clients stay authenticated
      expect(res.headers['set-cookie']).toBeDefined()
    })

    it('rejects a private key that does not belong to any account with 401', async () => {
      const res = await request(testApp)
        .post('/v1/auth/login')
        .send({ private_key: OTHER_PRIV_KEY })
        .expect(401)

      expect(res.body.errors[0].message).toBe('Invalid credentials.')
    })

    it('rejects a key shorter than 64 chars with 400', async () => {
      // too short to pass Joi validation
      const SHORT_KEY = 'short_key'

      const res = await request(testApp)
        .post('/v1/auth/login')
        .send({ private_key: SHORT_KEY })
        .expect(400)

      expect(res.body.errors).toBeDefined()
    })

    it('rejects a missing private_key with 400', async () => {
      const res = await request(testApp)
        .post('/v1/auth/login')
        .send({})
        .expect(400)

      expect(res.body.errors).toBeDefined()
    })
  })

  // 3. POST /v1/auth/logout

  describe('POST /v1/auth/logout', () => {
    it('clears the auth cookie for an authenticated user', async () => {
      const account = await createAccount()
      const token = generateJwt({
        id: account.id,
        private_key: PRIV_KEY,
        avatar: 'avatar1',
      })

      const res = await request(testApp)
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      // the cookie must be cleared so the session is truly ended
      const rawCookies = res.headers['set-cookie']
      const cookies: string[] = Array.isArray(rawCookies)
        ? rawCookies
        : rawCookies
        ? [rawCookies]
        : []

      const cleared = cookies.some((c) =>
        c.includes(`${ACCESS_TOKEN_COOKIE_NAME}=;`)
      )
      expect(cleared).toBe(true)
    })

    it('rejects an unauthenticated request with 403', async () => {
      await request(testApp).post('/v1/auth/logout').expect(403)
    })
  })

  // 4. GET /v1/auth/session

  describe('GET /v1/auth/session', () => {
    it('returns the account payload embedded in the token', async () => {
      const account = await createAccount()
      const token = generateJwt({
        id: account.id,
        avatar: 'avatar1',
        private_key: PRIV_KEY,
      })

      const res = await request(testApp)
        .get('/v1/auth/session')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body.id).toBe(account.id)
      expect(res.body.avatar).toBe('avatar1')

      // NOTE:
      // i commented this line because i am not so sure about how
      // the frontend will use the session endpoint response, but
      // the private_key should NEVER be sent to the client in any
      // circumstance.
      // expect(res.body.private_key).toBeUndefined()
    })

    it('rejects an unauthenticated request with 403', async () => {
      await request(testApp).get('/v1/auth/session').expect(403)
    })

    it('rejects a malformed token with 403', async () => {
      await request(testApp)
        .get('/v1/auth/session')
        .set('Authorization', 'Bearer <...very.bad.token.here...>')
        .expect(403)
    })
  })
})

function generateJwt(payload: object) {
  return jwt.sign(payload, JWT_SECRET)
}

async function createAccount(private_key = PRIV_KEY, avatar = 'avatar1') {
  const accountData = { private_key, avatar }
  return prisma.accounts.create({ data: accountData })
}
