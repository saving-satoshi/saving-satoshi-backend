import Joi, { ValidationResult } from 'joi'
import * as db from 'lib/database'

abstract class Model {
  abstract get table(): string
  abstract get schema(): Joi.ObjectSchema

  validate(
    data: Record<string, any>,
    options: Joi.ValidationOptions
  ): ValidationResult<any> {
    return this.schema.validate(data, options)
  }

  async exists(column: string, id: string): Promise<boolean> {
    const client = await db.getClient()

    try {
      await db.begin(client)
      const result = await db.exists(client, this.table, { [column]: id })
      await db.commit(client)
      return result
    } catch (ex) {
      await db.rollback(client)
      throw ex
    } finally {
      db.release(client)
    }
  }

  async create(data: any, options?: CreateOptions) {
    const client = await db.getClient()

    try {
      const keys = db.createKeys(data)
      const values = db.createValues(data)

      const conflict = options.uniqueOn
        ? `ON CONFLICT (${options.uniqueOn}) DO NOTHING`
        : ''

      await db.begin(client)
      const result = await db.query(
        client,
        `INSERT INTO ${this.table} (${keys}) VALUES (${values}) ${conflict} returning *`,
        []
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

  async find(data: any) {
    const client = await db.getClient()
    const { clause, values } = db.createWhereClause(data)

    try {
      await db.begin(client)
      const result = await db.query(
        client,
        `SELECT * FROM ${this.table} WHERE ${clause}`,
        values
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
}

interface CreateOptions {
  uniqueOn?: string
}

export default Model
