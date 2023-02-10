require('dotenv').config()

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function init() {
  const client = new Client()

  await client.connect()
  try {
    const result = await client.query("SELECT to_regclass('migrations');")
    const isInitialized = result.rows[0].to_regclass !== null

    if (isInitialized) {
      return console.log('Database already initialized.')
    }

    const initSQL = fs.readFileSync(
      path.join(__dirname, '..', 'init.sql'),
      'utf-8'
    )
    await client.query(initSQL)

    console.log('Successfully initialized database.')
  } catch (err) {
    console.error('Error running migrations:', err)
  } finally {
    client.end()
  }
}

init()
