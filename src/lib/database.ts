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

export const createWhereClause = (
  conditions: Record<string, any>,
  offset = 0
): {
  clause: string
  values: any[]
} => {
  const keys = Object.keys(conditions)
  const values = keys.map((key) => conditions[key])

  const clause = keys.reduce((result, key, index) => {
    const condition = `${key} = $${index + 1 + offset}`
    const separator = index < keys.length - 1 ? ' AND ' : ''

    return `${result}${condition}${separator}`
  }, '')

  return { clause, values }
}

export const createKeys = (keys) => {
  return Object.keys(keys).join(', ')
}

export const createValues = (values) => {
  return Object.values(values)
    .map((val) => {
      if (val === null || val === undefined) {
        return 'NULL'
      } else if (!isNaN(Number(val))) {
        return val
      } else if (typeof val === "string") {
        try {
          // Attempt to parse the string as JSON
          JSON.parse(val);
          return `'${val}'`;
        } catch (error) {
          // Parsing failed, handle it here
          const str = val as string;
          const escapedVal = str.replace(/'/g, "''");
          return `'${escapedVal}'`;
        }
      } else {
        const str = val as string
        const escapedVal = str.replace(/'/g, "''")
        return `'${escapedVal}'`
      }
    })
    .join(', ')
}
