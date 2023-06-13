import $ from '../vendor/jquery/js/jquery.esm.js'

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
