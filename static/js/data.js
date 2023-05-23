import $ from '../vendor/jquery/js/jquery.esm.js'
import { initSqlJs } from '/static/vendor/sql.js/js/sql-wasm.esm.js'
import { openDB } from 'https://unpkg.com/idb@7.1.1/build/index.js'

const params = new URLSearchParams(document.location.search)
const databaseURL = '/static/database.sqlite'

async function downloadAndCacheDatabase() {
  const db = await openDB('cacheDB', 1, {
    upgrade(db) {
      const store = db.createObjectStore('files', { keyPath: 'id' })
    }
  })

  const cachedFile = await db.get('files', databaseURL)
  if (cachedFile) {
    console.log('USE CACHED FILE');
    return cachedFile.data
  }

  console.log('FETCH REMOTE FILE')
  const response = await fetch(databaseURL)
  const arrayBuffer = await response.arrayBuffer()
  await db.put('files', { id: databaseURL, data: arrayBuffer })
  return arrayBuffer
}

const database = new Promise((resolve, reject) => {
  (async function () {
    const sqlPromise = initSqlJs(file => `/static/vendor/sql.js/js/${file}`)
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

const primaryColumn = params.get('type') == 'council' ? 'la_code' : 'force'
const nameColumn = params.get('type') == 'council' ? 'la_name' : 'force'

async function getData(where, count = null) {
  return database.then(db => {
    const limit = count ? `LIMIT ${count}` : ''
    const query = `SELECT * FROM data WHERE ${where} AND ${primaryColumn}=:id ${limit}`

    const stmt = db.prepare(query)
    stmt.bind({ ':id': params.get('id') })

    console.debug('DATA:', query)
    return parseResults(stmt)
  })
}

if (params.has('id') && params.has('type')) {
  getData('date=2020').then(data => console.log(data))
  getData('date=2019').then(data => console.log(data))
  getData('1=1', 1).then(data => data[0][nameColumn]).then(function (name) {
    $('.js-area-name').text(name)
  })
}
