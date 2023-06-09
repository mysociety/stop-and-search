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

  function fetchData() {
    const year = $("#year").val()
    const query = (year != '') ? `date=${year}` : null

    // Fetch all data for an area for a given year
    getData(query).then(function (data) {
      updateData(data)
      updatePlots(data)
    })
  }

  function updateData(data) {
    $('.js-data').each(function () {
      console.debug('---------')

      const metric = $(this).data('metric')
      console.debug('metric', metric)

      const metricCategory = $(this).data('metric-category') || metric
      console.debug('metricCategory', metricCategory)

      const metricData = data.filter(obj => obj.metric === metric && (obj.metric_category === 'NA' || obj.metric_category === metricCategory))
      console.debug('metricData', metricData)

      const valueTypes = [...new Set(metricData.map(obj => obj.value_type))]
      const type = (valueTypes.length > 1) ? $(this).data('type') : valueTypes[0]

      const metricTypeData = (valueTypes.length > 1) ?
        metricData.filter(obj => obj.value_type === type) :
        metricData
      const metricTypeSum = metricTypeData.reduce((acc, obj) => acc + obj.value, 0)
      const metricTypeCount = metricTypeData.length
      console.debug('metricTypeData', type, metricTypeData, metricTypeSum, metricTypeCount)

      const ethnicity = $(this).data('ethnicity')
      const ethnicityData = metricTypeData.filter(obj => obj.ethnicity === ethnicity && typeof obj.value === 'number')
      const ethnicitySum = ethnicityData.reduce((acc, obj) => acc + obj.value, 0)
      const ethnicityCount = ethnicityData.length
      console.debug('ethnicity', ethnicity, ethnicityData, ethnicitySum, ethnicityCount)

      const ethnicityOtherData = metricTypeData.filter(obj => obj.ethnicity !== ethnicity && typeof obj.value === 'number')
      const ethnicityOtherSum = ethnicityOtherData.reduce((acc, obj) => acc + obj.value, 0)
      const ethnicityOtherCount = ethnicityOtherData.length
      console.debug('ethnicityOther', `!${ethnicity}`, ethnicityOtherData, ethnicityOtherSum, ethnicityOtherCount)

      let value
      const format = $(this).data('format') || type
      switch (format) {
        case 'comparison-percentage':
          value = (((ethnicitySum / ethnicityCount) / (metricTypeSum / metricTypeCount)) * 50).toFixed()
          value = `${value}%`
          break
        case 'percentage':
          value = (ethnicitySum / ethnicityCount).toFixed(2)
          value = `${value}%`
          break
        case 'ratio-as-percentage':
          value = (((metricTypeSum / metricTypeCount) - 1) * 100)
          if (value < 0) { value = (1 - (1 / (metricTypeSum / metricTypeCount))) * -100 }
          value = `${value.toFixed()}%`
          break
        case 'ratio-as-more-or-less':
          value = (((metricTypeSum / metricTypeCount) - 1) * 100)
          if (value == 0) { value = 'as'}
          else if (value < 0) { value = 'less' }
          else { value = 'more' }
          break
        case 'ratio':
          value = (metricTypeSum / metricTypeCount).toFixed(2)
          break
        case 'frequency':
          value = ethnicitySum.toLocaleString()
          break
      }

      console.debug('value', value)

      const target = $(this).data('target')
      if (target == 'height') { $(this).css('height', value) }
      else if (target == 'width') { $(this).css('width', value) }
      else { $(this).text(value) }
    })
  }

  function updatePlots(data) {
    $('.js-plot').each(function () {
      const element = $(this).get(0)
      const metricData = data.filter(obj => obj.metric === 'or' || obj.metric === 'rr')

      function setPlotValue(element, data, category) {
        const categoryData = metricData.filter(obj => obj.metric_category === category)
        const categorySum = categoryData.reduce((acc, obj) => acc + obj.value, 0)
        const categoryCount = categoryData.length
        element.setAttribute(`data-${category}`, categorySum / categoryCount)
      }

      setPlotValue(element, metricData, 'rr')
      setPlotValue(element, metricData, 'rr_ci_low')
      setPlotValue(element, metricData, 'rr_ci_upp')
    })

    refreshForestPlots()
  }

  $('.dropdown-metric').on('change', fetchData)
  fetchData()
})

} catch (error) {
  console.error(error)
}
