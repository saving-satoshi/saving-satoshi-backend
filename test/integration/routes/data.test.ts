import request from 'supertest'
import { testApp, prisma } from '../setup'
import jwt from 'jsonwebtoken'

const PRIV_KEY = 'a'.repeat(64)
const JWT_SECRET = process.env.SECRET || 'test-secret'

describe('Data API', () => {
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

  // 1. PUT /v1/data

  describe('PUT /v1/data', () => {
    it('creates a new data entry for a lesson', async () => {
      const payload = { lesson_id: 'CH1INT1', data: { answer: 42 } }
      const res = await request(testApp)
        .put('/v1/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(200)

      const { lesson_id, data } = res.body
      expect(lesson_id).toBe('CH1INT1')
      expect(data).toEqual({ answer: 42 })
    })

    it('updates an existing entry instead of creating a duplicate', async () => {
      // first write; some initial random data
      const firstPayload = { lesson_id: 'CH1INT1', data: { answer: 1 } }
      const firstRes = await request(testApp)
        .put('/v1/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send(firstPayload)
        .expect(200)

      expect(firstRes.body.data).toEqual({ answer: 1 })

      // second write with different data; must overwrite, not duplicate
      const secondPayload = { lesson_id: 'CH1INT1', data: { answer: 99 } }
      const secondRes = await request(testApp)
        .put('/v1/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send(secondPayload)
        .expect(200)

      expect(secondRes.body.data).toEqual({ answer: 99 })

      const rows = await prisma.accounts_data.count({
        where: { account: accountId, lesson_id: 'CH1INT1' },
      })
      expect(rows).toBe(1)
    })

    it('stores data independently per lesson_id', async () => {
      const payloadA = { lesson_id: 'CH1INT1', data: { val: 'a' } }
      const payloadB = { lesson_id: 'CH2INT1', data: { val: 'b' } }

      const resA = await request(testApp)
        .put('/v1/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payloadA)
        .expect(200)

      const resB = await request(testApp)
        .put('/v1/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payloadB)
        .expect(200)

      const rows = await prisma.accounts_data.count({
        where: { account: accountId },
      })
      expect(rows).toBe(2)

      expect(resA.body.data).toEqual({ val: 'a' })
      expect(resB.body.data).toEqual({ val: 'b' })
    })

    it('rejects an unauthenticated request with 403', async () => {
      await request(testApp)
        .put('/v1/data')
        .send({ lesson_id: 'CH1INT1', data: {} })
        .expect(403)
    })
  })

  // 2. GET /v1/data/:lesson_id

  describe('GET /v1/data/:lesson_id', () => {
    it('returns the stored data for a lesson', async () => {
      const lessonId = 'CH1INT1'

      // seed some data for this lesson
      await request(testApp)
        .put('/v1/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ lesson_id: lessonId, data: { answer: 7 } })
        .expect(200)

      // now retrieve the data and verify it matches what we sent
      const res = await request(testApp)
        .get(`/v1/data/${lessonId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const { lesson_id, data } = res.body
      expect(lesson_id).toBe(lessonId)
      expect(data).toEqual({ answer: 7 })
    })

    it('returns 404 when no data exists for the lesson', async () => {
      const res = await request(testApp)
        .get('/v1/data/CH9UNKNOWN')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(res.body.errors[0].message).toBe('Lesson not found.')
    })

    it('rejects an unauthenticated request with 403', async () => {
      await request(testApp).get('/v1/data/CH1INT1').expect(403)
    })
  })
})

function generateJwt(payload: Record<string, any>) {
  return jwt.sign(payload, JWT_SECRET)
}

async function createAccount(private_key = PRIV_KEY, avatar = 'avatar1') {
  const accountData = { private_key, avatar }
  return prisma.accounts.create({ data: accountData })
}
