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

  async all(): Promise<any[]> {
    const client = await db.getClient()
    try {
      await db.begin(client)
      const result = await db.query(client, `SELECT * FROM ${this.table}`, [])
      await db.commit(client)
      return result.rows
    } catch (ex) {
      await db.rollback(client)
      throw ex
    } finally {
      db.release(client)
    }
  }

  async exists(column: string, id: string | number): Promise<boolean> {
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

  async find(data?: any) {
    const client = await db.getClient()

    try {
      await db.begin(client)

      let result
      if (data) {
        const { clause, values } = db.createWhereClause(data)
        result = await db.query(
          client,
          `SELECT * FROM ${this.table} WHERE ${clause}`,
          values
        )
      } else {
        result = await db.query(client, `SELECT * FROM ${this.table}`, [])
      }

      await db.commit(client)

      return result.rows[0]
    } catch (ex) {
      await db.rollback(client)
      throw ex
    } finally {
      db.release(client)
    }
  }

  async update(data: any, match?: any) {
    const client = await db.getClient()

    try {
      await db.begin(client)

      let result
      const { clause: setClause, values: setValues } =
        db.createWhereClause(data)

      const { clause: whereClause, values: whereValues } = db.createWhereClause(
        match,
        setValues.length
      )

      result = await db.query(
        client,
        `UPDATE ${this.table} SET ${setClause} WHERE ${whereClause} RETURNING *`,
        [...setValues, ...whereValues]
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

  async updateOrCreate(data: any, match?: any) {
    const existing = await this.find(match)
    const action = !existing
      ? this.create({ ...data, ...match }, { uniqueOn: 'account' })
      : this.update(data, match)
    return await action
  }
}

interface CreateOptions {
  uniqueOn?: string
}

export default Model
