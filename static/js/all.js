import * as _ from '../vendor/underscore/js/underscore.esm.min.js'
import $ from '../vendor/jquery/js/jquery.esm.js'
import { Modal, Tab } from '../vendor/bootstrap/js/bootstrap.esm.min.js'
import L from '../vendor/leaflet/js/leaflet-1.8.0.esm.js'
import councils from './councils.esm.js'
import policeForces from './police-forces.esm.js'

$(function(){
    window.map = setUpMap()

    var filterDataModal = new Modal($('#filterData')[0])

    updateShaderButton()

    $(document).on('click', '.js-remove-filter', function(){
        $(this).parents('.js-filter').remove()
        updateMap()
    })

    $(document).on('click', '.js-remove-shader', function(){
        $(this).parents('.js-shader').remove()
        updateMap()
        updateShaderButton()
    })

    $(document).on('change', '.js-filter', function(){
        updateMap()
    })

    $(document).on('click', '.js-add-filter', function(){
        $('#filterData').data('targetList', '.js-active-filters')
        $('#filterData .modal-title').text('Add filter')
        filterDataModal.show()
    })

    $(document).on('click', '.js-add-shader', function(){
        $('#filterData').data('targetList', '.js-active-shaders')
        $('#filterData .modal-title').text('Add shader')
        filterDataModal.show()
    })

    $(document).on('click', '.js-add-dataset', function(){
        var activeListSelector = $('#filterData').data('targetList')
        var datasetName = $.trim( $(this).find('strong').text() )
        var datasetParams = _.findWhere(window.datasets, {name: datasetName})

        if ( activeListSelector == '.js-active-shaders' ) {
            var templateId = 'templateShader'
        } else {
            var templateId = 'templateFilter'
        }

        var html = render(templateId, datasetParams)

        $( activeListSelector ).append( html )
        updateMap()
        updateShaderButton()

        filterDataModal.hide()
        $('#filterData').removeData('targetList')
        $('#filterData .modal-title').text('Add data')
    })

    $(document).on('click', '.js-view-as-councils', function(){
        window.map = updateFeatures(window.map, councils)
        $(this).siblings('button').removeClass('btn-primary').addClass('btn-outline-secondary')
        $(this).addClass('btn-primary').removeClass('btn-outline-secondary')
    })

    $(document).on('click', '.js-view-as-police-forces', function(){
        window.map = updateFeatures(window.map, policeForces)
        $(this).siblings('button').removeClass('btn-primary').addClass('btn-outline-secondary')
        $(this).addClass('btn-primary').removeClass('btn-outline-secondary')
    })
})

var render = function(templateId, data) {
    var rawTemplate = $('#' + templateId).html()
    return _.template(rawTemplate)(data)
}

var getAreaColor = function(feature) {
    var n = parseInt( feature.properties.id.slice(-1) )
    var activeShaders = $('.js-active-shaders .js-shader').length
    var colors = [
        '#ffffcc',
        '#ffeda0',
        '#fed976',
        '#feb24c',
        '#fd8d3c',
        '#fc4e2a',
        '#e31a1c',
        '#bd0026',
        '#800026',
        '#57001a'
    ]

    if ( activeShaders ) {
        return colors[n]
    } else {
        return '#ed6832'
    }
}

// Something to give the impression of filters reducing
// the number of matching features. By basing the
// visibility on the constituency’s ID we’re able to run
// this function again and again, and the feature will
// be consistently hidden or shown (rather than randomly
// changing each time), and by factoring in the number of
// active filters, and the index of the selected filter
// dropdowns, we give the impression that changes to the
// filters affect the number of results.
var getVisibilityForArea = function(feature) {
    var n = parseInt( feature.properties.id.slice(1) )
    var $activeFilters = $('.js-active-filters .js-filter')

    if ( $activeFilters.length ) {
        var offset = 2
        $activeFilters.find('option:selected').each(function(){
            offset += $(this).prevAll().length
        })
        return ( n % ($activeFilters.length * offset) ) === 0
    } else {
        return 1
    }
}

var getFeatureStyle = function(feature) {
    return {
        fillColor: getAreaColor(feature),
        weight: 2,
        opacity: ( getVisibilityForArea(feature) ? 1 : 0 ),
        color: 'white',
        fillOpacity: ( getVisibilityForArea(feature) ? 0.7 : 0 )
    }
}

var highlightFeature = function(e) {
    var layer = e.target

    layer.setStyle({
        weight: 5
    })

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront()
    }
}

var unhighlightFeature = function(e) {
    window.geojson.resetStyle(e.target);
}

var setUpMap = function() {
    var $map = $('.explore-map')

    if ( ! $map.length ) {
        return undefined
    }

    var map = L.map($map[0]).setView([54.0934, -2.8948], 7)

    L.tileLayer('https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=7ac28b44c7414ced98cd4388437c718d', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map)

    return updateFeatures(map, councils)
}

var updateFeatures = function(map, features) {
    if (window.geojson) {
        window.geojson.off()
        window.geojson.remove()
    }

    window.geojson = L.geoJson(features, {
        style: getFeatureStyle,
        onEachFeature: function(feature, layer){
            layer.on({
                mouseover: highlightFeature,
                mouseout: unhighlightFeature,
                click: function(){
                    window.location.href = './area?id=' + feature.properties.id + '&type=' + (feature.properties.type || 'council')
                }
            })
        }
    }).addTo(map)

    return map
}

var updateMap = function() {
    window.geojson.eachLayer(function(layer){
        layer.setStyle( getFeatureStyle(layer.feature) )
    })
}

var updateShaderButton = function() {
    $('.js-add-shader').toggle( $('.js-active-shaders .js-shader').length === 0 )
}

// Area
let dropdownMetric = $('.dropdown-metric');
let metricContent = $('.js-dinamic-metric-content');
let dropdownYear = $('#year');
let resetMetric = $('#reset-metric');

metricContent.hide();

function updateValues($param) {
    $('.metric-legislation').text($("#legislation option:selected").text());
    $('.metric-object').text($("#object-of-search option:selected").text());
    $('.metric-outcome').text($("#outcome option:selected").text());
    $('.metric-year').text($("#year option:selected").text());
}

dropdownMetric.on('change', function() {
    metricContent.fadeIn(500);
    updateValues();
});

resetMetric.on( "click", function() {
    $("#year").val('');
    $("#object-of-search").val('');
    $("#legislation").val('');
    $("#outcome").val('');
    updateValues();
} );
