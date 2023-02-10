import { Pool } from 'pg'

const pool = new Pool()

export const getClient = async () => {
  return await pool.connect()
}

export const begin = (client) => {
  return client.query('begin')
}

export const query = (client, query, values) => {
  return client.query(query, values)
}

export const exists = async (
  client,
  table: string,
  conditions: Record<string, any>
) => {
  const { clause, values } = createWhereClause(conditions)

  const result = await client.query({
    text: `SELECT * FROM ${table} WHERE ${clause}`,
    values,
  })

  return result.rowCount > 0
}

export const commit = (client) => {
  return client.query('commit')
}

export const rollback = (client) => {
  return client.query('rollback')
}

export const release = (client) => {
  client.release()
}

const createWhereClause = (
  conditions: Record<string, any>
): {
  clause: string
  values: any[]
} => {
  const keys = Object.keys(conditions)
  const values = keys.map((key) => conditions[key])

  const clause = keys.reduce((result, key, index) => {
    const condition = `${key} = $${index + 1}`
    const separator = index < keys.length - 1 ? ' AND ' : ''

    return `${result}${condition}${separator}`
  }, '')

  return { clause, values }
}
