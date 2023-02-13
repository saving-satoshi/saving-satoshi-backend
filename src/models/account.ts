import Joi from 'joi'
import * as db from '../lib/database'
import { Account } from '../types'

export const schema = Joi.object({
  avatar: Joi.string().uri(),
  private_key: Joi.string().min(64).max(64).required(),
})

export const validate = (data: Record<string, any>, joiOptions) => {
  return schema.validate(data, joiOptions)
}

export const exists = async (column: string, id: string): Promise<boolean> => {
  const client = await db.getClient()

  try {
    await db.begin(client)
    const result = await db.exists(client, 'accounts', { [column]: id })
    await db.commit(client)
    return result
  } catch (ex) {
    await db.rollback(client)
    throw ex
  } finally {
    db.release(client)
  }
}

export const create = async (data: Account) => {
  const client = await db.getClient()

  try {
    await db.begin(client)
    const result = await db.query(
      client,
      'INSERT INTO accounts(private_key, avatar) VALUES($1, $2) ON CONFLICT (private_key) DO NOTHING returning *',
      [data.private_key, data.avatar]
    )
    await db.commit(client)

    return result.rows[0]
  } catch (ex) {
    await db.rollback(client)
    throw ex
  } finally {
    db.release(client)
  }
}

export const find = async (column: string, value: string) => {
  const client = await db.getClient()

  try {
    await db.begin(client)
    const result = await db.query(
      client,
      `SELECT * FROM accounts WHERE ${column} = $1`,
      [value]
    )
    await db.commit(client)

    return result.rows[0]
  } catch (ex) {
    await db.rollback(client)
    throw ex
  } finally {
    db.release(client)
  }
}
