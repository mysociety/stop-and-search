import $ from '../vendor/jquery/js/jquery.esm.js'
import { initSqlJs } from '../vendor/sql.js/js/sql-wasm.esm.js'
import { openDB } from '../vendor/idb/js/index.js'
import { updateAll as refreshForestPlots } from './forest-plots.js'

try {

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
      console.log('USE CACHED FILE')
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

$(function() {
  $('.js-area-name').text(area.name)

  function updateData() {
    const year = $("#year").val()

    $('.js-data').each(function () {
      const metric = $(this).data('metric')
      const ethnicity = $(this).data('ethnicity')

      const baseQuery = `metric="${metric}" AND ethnicity="${ethnicity}"`
      const query = (year != '') ? `date=${year} AND ${baseQuery}` : baseQuery

      const $this = $(this)

      getData(query).then(function (data) {
        let sum = 0
        let count = 0
        let value

        data.forEach((obj) => {
          if (typeof obj.value === 'number') {
            sum += obj.value
            count++
          }
        })

        if (data[0].value_type == 'percentage') {
          sum = sum / count
          value = (sum).toFixed(2)
        } else if (data[0].value_type == 'frequency') {
          value = sum.toLocaleString()
        }

        if ($this.data('target') == 'width') {
          $this.css('width', `${value}%`)
        } else {
          $this.text(value)
        }
      })
    })
  }

  function updatePlots() {
    const year = $("#year").val()

    const promises = $('.js-plot').map(function () {
      if (year == '') { return }
      const query = `date=${year} AND value_type="ratio"` 
      const element = $(this).get(0)

      return getData(query).then(function (data) {
        data.forEach((obj) => {
          element.setAttribute(`data-${obj.metric_category}`, obj.value)
        })
      })
    })

    Promise.all(promises).then(refreshForestPlots)
  }

  $('.dropdown-metric').on('change', updateData)
  updateData()

  $('.dropdown-metric').on('change', updatePlots)
  updatePlots()
})

} catch (error) {
  console.error(error)
}
