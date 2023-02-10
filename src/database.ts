import { Pool } from 'pg'

class Database {
  pool: any

  constructor() {
    this.pool = new Pool()
  }

  async getClient() {
    return await this.pool.connect()
  }

  begin(client) {
    return client.query('begin')
  }

  query(client, query, values) {
    return client.query(query, values)
  }

  async exists(client, table: string, conditions: Record<string, any>) {
    const { clause, values } = createWhereClause(conditions)

    const result = await client.query({
      text: `SELECT * FROM ${table} WHERE ${clause}`,
      values,
    })

    return result.rowCount > 0
  }

  commit(client) {
    return client.query('commit')
  }

  rollback(client) {
    return client.query('rollback')
  }

  release(client) {
    client.release()
  }
}

function createWhereClause(conditions: Record<string, any>): {
  clause: string
  values: any[]
} {
  const keys = Object.keys(conditions)
  const values = keys.map((key) => conditions[key])

  const clause = keys.reduce((result, key, index) => {
    const condition = `${key} = $${index + 1}`
    const separator = index < keys.length - 1 ? ' AND ' : ''

    return `${result}${condition}${separator}`
  }, '')

  return { clause, values }
}

export default new Database()
