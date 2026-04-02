import request from 'supertest'
import { testApp, prisma } from '../setup'
import jwt from 'jsonwebtoken'

const PRIV_KEY = 'a'.repeat(64)
const JWT_SECRET = process.env.SECRET || 'test-secret'

describe('Accounts API', () => {
  let authToken: string
  let accountId: number

  beforeEach(async () => {
    const account = await createAccount()
    accountId = account.id
    authToken = generateJwt({
      id: accountId,
      avatar: 'avatar1',
      private_key: PRIV_KEY,
    })
  })

  // 1. GET /v1/accounts/:accountId

  describe('GET /v1/accounts/:accountId', () => {
    it('returns account data without the private_key', async () => {
      const token = generateJwt({
        id: accountId,
        avatar: 'avatar1',
        private_key: PRIV_KEY,
      })

      const res = await request(testApp)
        .get(`/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      const { id, avatar, private_key } = res.body
      expect(id).toBe(accountId)
      expect(avatar).toBe('avatar1')

      // private_key must NEVER leave the server
      expect(private_key).toBeUndefined()
    })

    it('returns 404 when the account does not exist', async () => {
      const token = generateJwt({
        id: accountId,
        avatar: 'avatar1',
        private_key: PRIV_KEY,
      })

      const res = await request(testApp)
        .get('/v1/accounts/9999999') // an ID that doesn't exist
        .set('Authorization', `Bearer ${token}`)
        .expect(404)

      expect(res.body.errors[0].message).toBe('Account not found.')
    })

    it('returns 400 when accountId is not a number', async () => {
      const token = generateJwt({
        id: accountId,
        avatar: 'avatar1',
        private_key: PRIV_KEY,
      })

      const res = await request(testApp)
        .get('/v1/accounts/not-a-number')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      expect(res.body.errors).toBeDefined()
    })

    it('rejects an unauthenticated request with 403', async () => {
      await request(testApp).get(`/v1/accounts/${accountId}`).expect(403)
    })

    it('rejects a malformed JWT with 403', async () => {
      await request(testApp)
        .get(`/v1/accounts/${accountId}`)
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
