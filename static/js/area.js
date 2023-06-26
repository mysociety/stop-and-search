import $ from '../vendor/jquery/js/jquery.esm.js'
import { getArea, getData } from './data.js'
import { updateAll as refreshForestPlots } from './forest-plots.js'

$(function(){
  let dropdownMetric = $('.dropdown-metric')
  let metricContent = $('.js-dynamic-metric-content')
  let dropdownYear = $('#year')
  let resetMetric = $('#reset-metric')

  metricContent.hide()

  dropdownMetric.on('change', function() {
    updateValues()
  })

  resetMetric.on( "click", function() {
    $("#year").val('')
    $("#object").val('')
    $("#legislation").val('')
    $("#outcome").val('')
    updateValues()
  })
})

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

const areaPage = function() {
  $('.js-area-name').text(area.name)

  $('[data-area-type]').each(function() {
    const element = $(this).get(0)
    if (element.getAttribute('data-area-type') === params.get('type')) {
      element.removeAttribute('hidden')
    } else {
      element.setAttribute('hidden', 'hidden')
    }
  })

  function fetchData() {
    // Fetch all data for an area for a given year
    getData({ 'areas.id = ?': area.id }).
      then(function (data) { updateData(data) })

    getData({ 'areas.id = ?': area.id, 'metric = ?': 'rr' }).
      then(function (data) { updatePlots(data) })
  }

  function updateData(data) {
    $('.js-data').each(function () {
      console.debug('---------')

      const year = parseInt($(this).data('year') || $('#year').val())
      console.debug('year', year)

      const yearData = data.filter(obj => obj.date === year)
      console.debug('yearData', yearData)

      const metric = $(this).data('metric')
      console.debug('metric', metric)

      const metricCategory = $(this).data('metric-category') || metric
      console.debug('metricCategory', metricCategory)

      const metricData = yearData.filter(obj => obj.metric === metric && (obj.metric_category === 'NA' || obj.metric_category === metricCategory))
      console.debug('metricData', metricData)

      const valueTypes = [...new Set(metricData.map(obj => obj.value_type))]
      const type = (valueTypes.length > 1) ? $(this).data('type') : valueTypes[0]

      const metricTypeData = (valueTypes.length > 1) ?
        metricData.filter(obj => obj.value_type === type) :
        metricData
      const metricTypeValue = (type === 'frequency') ?
        metricTypeData.reduce((acc, obj) => acc + obj.value, 0) :
        metricTypeData.reduce((acc, obj) => acc + obj.value, 0) / metricTypeData.length
      console.debug('metricTypeData', type, metricTypeValue)

      const ethnicity = $(this).data('ethnicity')
      const ethnicityData = metricTypeData.filter(obj => obj.ethnicity === ethnicity && typeof obj.value === 'number')[0]
      const ethnicityValue = (ethnicityData) ? ethnicityData.value : 0
      if (ethnicity) { console.debug('ethnicity', ethnicity, ethnicityValue) }

      let value
      const format = $(this).data('format') || type
      switch (format) {
        case 'comparison-percentage':
          value = ((ethnicityValue / metricTypeValue) * 50).toFixed()
          value = `${value}%`
          break
        case 'percentage':
          value = ethnicityValue.toFixed(2)
          value = `${value}%`
          break
        case 'ratio-as-percentage':
          value = Math.abs((metricTypeValue - 1) * 100)
          value = `${value.toFixed()}%`
          break
        case 'ratio-as-more-or-less':
          value = ((metricTypeValue - 1) * 100)
          if (value == 0) { value = 'as'}
          else if (value < 0) { value = 'less' }
          else { value = 'more' }
          break
        case 'ratio':
          value = metricTypeValue.toFixed(2)
          break
        case 'frequency':
          value = ethnicityValue.toLocaleString()
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
      const yearData = data.filter(obj => obj.date === parseInt($('#year').val()))

      function setPlotValue(category) {
        const categoryData = yearData.filter(obj => obj.metric_category === category)[0]
        const categoryValue = categoryData.value
        element.setAttribute(`data-${category}`, categoryValue)
      }

      setPlotValue('rr')
      setPlotValue('rr_ci_low')
      setPlotValue('rr_ci_upp')
    })

    const min = Math.min(...data.filter(obj => obj.metric_category === 'rr_ci_low').map(obj => obj.value))
    const max = Math.max(...data.filter(obj => obj.metric_category === 'rr_ci_upp').map(obj => obj.value))

    refreshForestPlots(min, max)
  }

  $('.dropdown-metric').on('change', fetchData)
  fetchData()
}

const params = new URLSearchParams(document.location.search)
const area = await getArea({ 'id = ?': params.get('id'), 'type = ?': params.get('type') })
if (area) { $(areaPage) }
