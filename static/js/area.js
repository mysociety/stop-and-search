import { Modal } from '../vendor/bootstrap/js/bootstrap.esm.min.js'
import $ from '../vendor/jquery/js/jquery.esm.js'
import { getArea, getData } from './data.js'
import { updateAll as refreshForestPlots } from './forest-plots.js'
import { setupAll as refreshBarCharts } from './bar-charts.js'

const areaPage = function() {
  let dropdownMetric = $('.dropdown-metric')
  let metricContent = $('.js-dynamic-metric-content')
  let dropdownYear = $('#year')
  let resetMetric = $('#reset-metric')

  $('[data-bs-toggle="modal"]').click(function (e) {
    new Modal($(this).get(0))
    e.preventDefault()
  })

  metricContent.hide()

  dropdownMetric.on('change', function() {
    updateValues()
  })

  resetMetric.on( "click", function() {
    $("#year").val('0')
    $("#object").val('')
    $("#legislation").val('')
    $("#outcome").val('')
    updateValues()
    fetchData()
  })

  if (area.type === 'pfa') {
    $('.js-area-name').text(`${area.name.replace('Police', '')} PFA`)
  } else {
    $('.js-area-name').text(area.name.replace(', City of', '').replace(', County of', ''))
  }

  $('.js-area-url').text(`${absolutePath}area?id=${area.id}&type=${area.type}`)

  if (!area.county) {
    $('.js-area-county').hide()
  } else {
    $('.js-area-county').text(area.county).show()
  }

  if (!area.region) {
    $('.js-area-region').hide()
  } else {
    $('.js-area-region').text(area.region).show()
  }

  if (!area.country) {
    $('.js-area-country').hide()
  } else {
    $('.js-area-country').text(area.country).show()
  }

  $('[data-area-type]').each(function() {
    const element = $(this).get(0)
    if (element.getAttribute('data-area-type') === params.get('type')) {
      element.removeAttribute('hidden')
    } else {
      element.setAttribute('hidden', 'hidden')
    }
  })

  $('.dropdown-metric').on('change', fetchData)
  fetchData()
}

function updateValues() {
  const object = $("#object option:selected").text()
  $('.metric-object .js-value').text(object)

  if (object != 'All') {
    $('.metric-object.js-dynamic-metric-content').fadeIn(500)
  } else {
    $('.metric-object.js-dynamic-metric-content').fadeOut(500)
  }

  const legislation = $("#legislation option:selected").text()
  $('.metric-legislation .js-value').text(legislation)

  if (legislation != 'All') {
    $('.metric-legislation.js-dynamic-metric-content').fadeIn(500)
  } else {
    $('.metric-legislation.js-dynamic-metric-content').fadeOut(500)
  }

  const outcome = $("#outcome option:selected").text()
  $('.metric-outcome .js-value').text(outcome)

  if (outcome != 'All') {
    $('.metric-outcome.js-dynamic-metric-content').fadeIn(500)
  } else {
    $('.metric-outcome.js-dynamic-metric-content').fadeOut(500)
  }

  $('.metric-year').text($("#year option:selected").text())
}

function fetchData() {
  // Fetch all data for an area for a given year
  getData({ 'areas.id = ?': area.id }).
    then(function (data) { updateData(data) })

  getData({ 'areas.id = ?': area.id, 'metric = ?': 'rr' }).
    then(function (data) { updatePlots(data) })

  getData({ 'areas.id = ?': area.id, 'metric IN (?, ?, ?)': ['object_of_search', 'legislation', 'outcome'] }).
    then(function (data) { updateBars(data) })
}

function updateData(data) {
  $('.js-data').each(function () {
    const debug = $(this).data('debug')
    if (debug) { console.debug('---------') }
    if (debug) { console.debug('data', data) }

    const year = parseInt($(this).data('year') || $('#year').val())
    if (debug) { console.debug('year', year) }

    const yearData = data.filter(obj => obj.date === year)
    if (debug) { console.debug('yearData', yearData) }

    const metric = $(this).data('metric')
    if (debug) { console.debug('metric', metric) }

    const metricCategory = $(this).data('metric-category') || metric
    if (debug) { console.debug('metricCategory', metricCategory) }

    const metricData = yearData.filter(obj => obj.metric === metric && (obj.metric_category === 'NA' || obj.metric_category === metricCategory))
    if (debug) { console.debug('metricData', metricData) }

    const valueTypes = [...new Set(metricData.map(obj => obj.value_type))]
    const type = (valueTypes.length > 1) ? $(this).data('type') : valueTypes[0]

    const metricTypeData = (valueTypes.length > 1) ?
      metricData.filter(obj => obj.value_type === type) :
      metricData
    const metricTypeValue = metricTypeData.reduce((acc, obj) => acc + obj.value, 0)
    if (debug) {
      console.debug('metricTypeData', metricTypeData)
      console.debug('metricType', type, metricTypeValue)
    }

    const ethnicity = $(this).data('ethnicity')
    let ethnicityValue
    if (ethnicity) {
      const ethnicityData = metricTypeData.filter(obj => obj.ethnicity === ethnicity && typeof obj.value === 'number')[0]
      ethnicityValue = (ethnicityData) ? ethnicityData.value : 0
      if (debug) {
        console.debug('ethnicityData', ethnicityData)
        console.debug('ethnicity', ethnicity, ethnicityValue)
      }
    } else {
      ethnicityValue = metricTypeValue
    }

    let value
    const format = $(this).data('format') || type
    if (debug) { console.debug('format', format) }
    switch (format) {
      case 'comparison-percentage':
        value = ((ethnicityValue / metricTypeValue) * 100).toFixed()
        value = `${value}%`
        break
      case 'percentage':
        value = ethnicityValue.toFixed(2)
        value = `${value}%`
        break
      case 'ratio-as-percentage':
        value = Math.abs((ethnicityValue - 1) * 100)
        value = `${value.toFixed()}%`
        break
      case 'ratio-as-more-or-less':
        value = ((ethnicityValue - 1) * 100)
        if (value == 0) { value = 'as'}
        else if (value < 0) { value = 'less' }
        else { value = 'more' }
        break
      case 'ratio':
        value = ethnicityValue.toFixed(2)
        break
      case 'frequency':
        value = ethnicityValue.toLocaleString()
        break
    }

    if (debug) { console.debug('value', value) }

    const target = $(this).data('target')
    if (target == 'height') { $(this).css('height', value) }
    else if (target == 'width') { $(this).css('width', value) }
    else { $(this).text(value) }
  })
}

function updatePlots(data) {
  $('.js-plot').each(function () {
    const element = $(this).get(0)
    const yearData = data.filter(obj => obj.date === parseInt($('#year').val()))

    const ethnicity = $(this).data('ethnicity')
    const ethnicityData = yearData.filter(obj => obj.ethnicity === ethnicity)

    function setPlotValue(category) {
      const categoryData = ethnicityData.filter(obj => obj.metric_category === category)[0]
      const categoryValue = categoryData ? categoryData.value : 0
      element.setAttribute(`data-${category}`, categoryValue)
    }

    setPlotValue('rr')
    setPlotValue('rr_ci_low')
    setPlotValue('rr_ci_upp')
  })

  const minValues = data.filter(obj => obj.metric_category === 'rr_ci_low').
    map(function(obj) {
      if (typeof obj.value === 'number') { return obj.value }
      return 1
    })
  const min = Math.min(...minValues)

  const maxValues = data.filter(obj => obj.metric_category === 'rr_ci_upp').
    map(function(obj) {
      if (typeof obj.value === 'number') { return obj.value }
      return 1
    })
  const max = Math.max(...maxValues)

  refreshForestPlots(min, max)
}

function updateBars(data) {
  $('.js-bar').each(function () {
    const element = $(this).get(0)

    const yearData = data.filter(obj => obj.date === parseInt($('#year').val()))

    const metric = $(this).data('metric')
    const metricData = yearData.filter(obj => obj.metric === metric)

    const metricTypeData = metricData.filter(obj => obj.value_type === 'percentage')
    const parsedData = { y: barChartEthnicities, x: {} }

    const categories = [...new Set(metricTypeData.map((obj) => obj.metric_category))]
    for (const i in categories) {
      const category = categories[i]
      const categoryData = metricTypeData.filter(obj => obj.metric_category === category)

      const values = []
      for (const j in barChartEthnicities) {
        const ethnicity = barChartEthnicities[j]
        const ethnicityData = categoryData.filter(obj => obj.ethnicity === ethnicity)[0]
        const ethnicityValue = ethnicityData ? ethnicityData.value : 0

        values.push(parseFloat(ethnicityValue.toFixed(2)))
      }
      parsedData.x[category] = values
    }

    const parsedDataJSON = JSON.stringify(parsedData);
    element.setAttribute('data-source', parsedDataJSON)
  })

  refreshBarCharts()
}

const params = new URLSearchParams(document.location.search)
const area = await getArea({ 'id = ?': params.get('id'), 'type = ?': params.get('type') })
if (area) { $(areaPage) }

function forEachElement(arg1, arg2, arg3) {
  var context = (typeof arg3 == 'function') ? arg1 : document;
  var selector = (typeof arg3 == 'function') ? arg2 : arg1;
  var callback = (typeof arg3 == 'function') ? arg3 : arg2;

  var elements = context.querySelectorAll(selector);
  Array.prototype.forEach.call( elements, callback );
};

forEachElement('[data-ethnicity-comparisson]', function(trigger){
  trigger.addEventListener('click', function(){
      var ethnicityType = trigger.getAttribute('data-ethnicity-comparisson');
      var container = document.querySelector('.js-dynamic-ethnicity-comparisson');
      container.setAttribute('data-ethnicity-comparisson-active', ethnicityType);
  });
});
