import $ from '../vendor/jquery/js/jquery.esm.js'
import { initSqlJs } from '../vendor/sql.js/js/sql-wasm.esm.js'
import { openDB } from 'https://unpkg.com/idb@7.1.1/build/index.js'

const params = new URLSearchParams(document.location.search)

if (!params.has('id') || !params.has('type')) {
  throw new Error('Missing parameters')
}

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
      console.log('USE CACHED FILE');
      return cachedFile.data
    }
  }

  console.log('FETCH REMOTE FILE')
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

async function getArea() {
  return database.then(db => {
    const query = `
      SELECT areas.* FROM areas
      WHERE id=:id AND type=:type
      LIMIT 1
    `

    const stmt = db.prepare(query)
    stmt.bind({ ':id': params.get('id'), ':type': params.get('type') })

    return parseResults(stmt)
  }).then(data => data[0])
}

const area = await getArea()

async function getData(_where = null, _limit = null) {
  return database.then(db => {
    const where = _where ? `AND ${_where}` : ''
    const limit = _limit ? `LIMIT ${_limit}` : ''
    const query = `
      SELECT data.* FROM data
      INNER JOIN areas ON data.area_id = areas.id
      WHERE areas.id = :id ${where} ${limit}
    `

    const stmt = db.prepare(query)
    stmt.bind({ ':id': area.id })

    return parseResults(stmt)
  })
}

getData().then(data => console.log(data))
getData('date=2021').then(data => console.log(data))
getData('date=2020').then(data => console.log(data))
getData('date=2019').then(data => console.log(data))

$('.js-area-name').text(area.name)
