import request from 'supertest'
import { testApp, prisma } from '../setup'
import jwt from 'jsonwebtoken'

describe('Progress API', () => {
  let authToken: string
  let accountId: number

  beforeEach(async () => {
    const account = await prisma.accounts.create({
      data: {
        private_key: 'test_private_123',
        avatar: 'avatar1',
      },
    })
    accountId = account.id
    authToken = jwt.sign({ id: accountId, private_key: 'test_private_key_123', avatar: 'avatar1' }, process.env.SECRET || 'test-secret')
  })

  describe('PUT /api/v1/progress', () => {
    it('should save progress with short lesson IDs', async () => {
      const progressState = {
        currentChapter: 1,
        currentLesson: 'CH1INT1',
        chapters: [],
      }

      const response = await request(testApp)
        .put('/api/v1/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ progress_state: progressState })
        .expect(200)

      expect(response.body.progress).toBe('CH1INT1')
      expect(response.body.progress_state).toEqual(progressState)
    })

    it('should save progress with medium length lesson IDs', async () => {
      const progressState = {
        currentChapter: 9,
        currentLesson: 'CH9OPC10',
        chapters: [],
      }

      const response = await request(testApp)
        .put('/api/v1/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ progress_state: progressState })
        .expect(200)

      expect(response.body.progress).toBe('CH9OPC10')
      expect(response.body.progress_state).toEqual(progressState)
    })

    it('should save progress with long lesson IDs (14 characters)', async () => {
      const progressState = {
        currentChapter: 6,
        currentLesson: 'CH6PUT3_NORMAL',
        chapters: [],
      }

      const response = await request(testApp)
        .put('/api/v1/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ progress_state: progressState })
        .expect(200)

      expect(response.body.progress).toBe('CH6PUT3_NORMAL')
      expect(response.body.progress_state).toEqual(progressState)
    })

    it('should save progress with long lesson IDs for HARD Chapters', async () => {
      const progressState = {
        currentChapter: 6,
        currentLesson: 'CH6PUT3_HARD',
        chapters: [],
      }

      const response = await request(testApp)
        .put('/api/v1/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ progress_state: progressState })
        .expect(200)

      expect(response.body.progress).toBe('CH6PUT3_HARD')
      expect(response.body.progress_state).toEqual(progressState)
    })

    it('should retrieve saved progress correctly with long lesson IDs', async () => {
      const progressState = {
        currentChapter: 6,
        currentLesson: 'CH6PUT3_HARD',
        chapters: [
          {
            id: 6,
            completed: false,
            hasDifficulty: true,
            selectedDifficulty: 'HARD',
            difficulties: [
              {
                level: 'HARD',
                lessons: [
                  { id: 'CH6PUT3_HARD', path: '/chapter-6/put-it-together-3-hard', completed: true },
                ],
                completed: false,
              },
            ],
          },
        ],
      }

      await request(testApp)
        .put('/api/v1/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ progress_state: progressState })
        .expect(200)

      const getResponse = await request(testApp)
        .get('/api/v1/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(getResponse.body.progress).toBe('CH6PUT3_HARD')
      expect(getResponse.body.progress_state.currentLesson).toBe('CH6PUT3_HARD')
    })
  })
})
