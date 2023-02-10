import Joi from 'joi'
import db from '../database'
import { Account } from '../types'

export const schema = Joi.object({
  avatar: Joi.string().uri(),
  code: Joi.string().min(64).max(64).required(),
})

export default {
  schema,

  validate(data: Record<string, any>, joiOptions) {
    return this.schema.validate(data, joiOptions)
  },

  async exists(code: string): Promise<boolean> {
    const client = await db.getClient()

    try {
      await db.begin(client)
      const result = await db.exists(client, 'accounts', { code })
      await db.commit(client)
      return result
    } catch (ex) {
      await db.rollback(client)
      throw ex
    } finally {
      db.release(client)
    }
  },

  async create(data: Account) {
    const client = await db.getClient()
    try {
      await db.begin(client)
      const result = await db.query(
        client,
        'INSERT INTO accounts(code, avatar) VALUES($1, $2) ON CONFLICT (code) DO NOTHING returning *',
        [data.code, data.avatar]
      )
      await db.commit(client)

      return result.rows[0]
    } catch (ex) {
      await db.rollback(client)
      throw ex
    } finally {
      db.release(client)
    }
  },

  async find(code: string) {
    const client = await db.getClient()
    try {
      await db.begin(client)
      const result = await db.query(
        client,
        'SELECT * FROM accounts WHERE code = $1',
        [code]
      )
      await db.commit(client)

      return result.rows[0]
    } catch (ex) {
      await db.rollback(client)
      throw ex
    } finally {
      db.release(client)
    }
  },
}
