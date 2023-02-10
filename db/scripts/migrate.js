require('dotenv').config()

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function migrate() {
  const client = new Client()

  await client.connect()

  try {
    const result = await client.query('SELECT version FROM migrations')
    const currentVersion = result.rows[0].version

    const migrationFiles = fs.readdirSync(
      path.join(__dirname, '..', 'migrations')
    )

    migrationFiles.sort((a, b) => parseInt(a) - parseInt(b))

    let c = 0
    let latestVersion = currentVersion

    for (const file of migrationFiles) {
      const version = parseInt(file)
      if (version > currentVersion) {
        const migrationSQL = fs.readFileSync(
          path.join(__dirname, '..', 'migrations', file),
          'utf-8'
        )
        await client.query(migrationSQL)
        latestVersion = version
        console.log(`Applied migration ${version}.`)
        c++
      }
    }

    console.log(
      c === 0
        ? 'Database is up-to-date.'
        : `Successfully applied migrations up to version ${latestVersion}.`
    )
  } catch (err) {
    console.error('Error running migrations:', err)
  } finally {
    await client.end()
  }
}

migrate()
