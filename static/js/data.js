import $ from '../vendor/jquery/js/jquery.esm.js'
import { initSqlJs } from '../vendor/sql.js/js/sql-wasm.esm.js'
import { openDB } from '../vendor/idb/js/index.js'

const databaseURL = `${staticPath}/database.sqlite`
const versionURL = `${staticPath}/database.version`

async function downloadAndCacheDatabase() {
  const db = await openDB('cacheDB', 1, {
    upgrade(db) {
      const store = db.createObjectStore('files', { keyPath: 'id' })
    }
  })

  const versionResponse = await fetch(versionURL)
  const currentVersion = await versionResponse.text()
  const cachedVersion = await db.get('files', versionURL)

  if (cachedVersion && currentVersion == cachedVersion.data) {
    const cachedFile = await db.get('files', databaseURL)
    if (cachedFile) {
      console.debug('USE CACHED FILE')
      return cachedFile.data
    }
  }

  console.debug('FETCH REMOTE FILE')
  const response = await fetch(databaseURL)
  const arrayBuffer = await response.arrayBuffer()
  await db.put('files', { id: databaseURL, data: arrayBuffer })
  await db.put('files', { id: versionURL, data: currentVersion })
  return arrayBuffer
}

const database = new Promise((resolve, reject) => {
  (async function () {
    const sqlPromise = initSqlJs(file => `${staticPath}/vendor/sql.js/js/${file}`)
    const dataPromise = downloadAndCacheDatabase()
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])

    console.debug('LOAD DATABASE')
    return new SQL.Database(new Uint8Array(buf))
  })()
    .then(db => resolve(db))
    .catch(error => reject(error))
})

function parseResults(stmt) {
  const results = []
  while (stmt.step()) results.push(stmt.getAsObject())

  stmt.free()
  return results
}

async function getArea(conditions = { '1 = ?': 1 }) {
  return database.then(db => {
    const keys = Object.keys(conditions)
    const values = Object.values(conditions).flat(1)
    const conditionString = keys.join(' AND ')

    const query = `
      SELECT areas.* FROM areas
      WHERE ${conditionString}
      LIMIT 1
    `

    const stmt = db.prepare(query)
    stmt.bind(values)

    return parseResults(stmt)
  }).then(data => data[0])
}

async function getData(conditions = { '1 = ?': 1 }) {
  return database.then(db => {
    const keys = Object.keys(conditions)
    const values = Object.values(conditions).flat(1)
    const conditionString = keys.join(' AND ')

    const query = `
      SELECT data.*, areas.type FROM data
      INNER JOIN areas ON data.area_id = areas.id
      WHERE ${conditionString}
    `

    const stmt = db.prepare(query)
    stmt.bind(values)

    return parseResults(stmt)
  })
}

async function getQuery(query, values) {
  return database.then(db => {
    const stmt = db.prepare(query)
    stmt.bind(values)
    return parseResults(stmt)
  })
}

export { getArea, getData, getQuery }
