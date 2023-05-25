import $ from '../vendor/jquery/js/jquery.esm.js'

$(function(){
    let dropdownMetric = $('.dropdown-metric')
    let metricContent = $('.js-dinamic-metric-content')
    let dropdownYear = $('#year')
    let resetMetric = $('#reset-metric')

    metricContent.hide()

    dropdownMetric.on('change', function() {
        metricContent.fadeIn(500)
        updateValues()
    })

    resetMetric.on( "click", function() {
        $("#year").val('')
        $("#object-of-search").val('')
        $("#legislation").val('')
        $("#outcome").val('')
        updateValues()
    })
})

function updateValues($param) {
    $('.metric-legislation').text($("#legislation option:selected").text())
    $('.metric-object').text($("#object-of-search option:selected").text())
    $('.metric-outcome').text($("#outcome option:selected").text())
    $('.metric-year').text($("#year option:selected").text())
}
