import $ from '../vendor/jquery/js/jquery.esm.js'
import Plotly from '../vendor/plotly/js/plotly.esm.js'

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

const data1 = [
  {
    name: "OR",
    x: [1],
    y: [1],
    error_x: {
      array: [4.8],
      arrayminus: [2],
      type: "data",
      symmetric: false,
      color: "green",
      thickness: 3
    },
    text: ["1(-1,5.8)"],
    hoverinfo: "text",
    mode: "markers",
    type: "scatter",
    marker: {
      size: 10,
      color: "orange"
    }
  },
  {
    name: "RR",
    x: [2],
    y: [2],
    error_x: {
      array: [1.2],
      arrayminus: [1],
      type: "data",
      symmetric: false,
      color: "green",
      thickness: 3
    },
    text: ["2(-1,3.2)"],
    hoverinfo: "text",
    mode: "markers",
    type: "scatter",
    marker: {
      size: 10,
      color: "blue"
    }
  }
]

const data2 = [
  {
    name: "OR",
    x: [3],
    y: [1],
    error_x: {
      array: [2.5],
      arrayminus: [5],
      type: "data",
      symmetric: false,
      color: "green",
      thickness: 3
    },
    text: ["3(-2,5.5)"],
    hoverinfo: "text",
    mode: "markers",
    type: "scatter",
    marker: {
      size: 10,
      color: "orange"
    }
  },
  {
    name: "RR",
    x: [4.5],
    y: [2],
    error_x: {
      array: [2.5],
      arrayminus: [5],
      type: "data",
      symmetric: false,
      color: "green",
      thickness: 3
    },
    text: ["4.5(2,9.5)"],
    hoverinfo: "text",
    mode: "markers",
    type: "scatter",
    marker: {
      size: 10,
      color: "blue"
    }
  }
]

const data3 = []

const layout = {
  xaxis: {
    range: [-3, 9],
    showline: true,
    zeroline: false,
    fixedrange: true
  },
  yaxis: {
    range: [0, 3],
    showgrid: false,
    zeroline: false,
    showticklabels: false,
    fixedrange: true
  },
  hoverlabel: { bgcolor: "lightgray" },
  showlegend: false,
  width: 600,
  height: 60,
  margin: {
    b: 0,
    l: 0,
    r: 0,
    t: 0
  }
}
const layout1 = Object.assign({}, layout, {
  height: 30,
  margin: {
    b: 30,
    l: 0,
    r: 0,
    t: 0
  }
})

const config = {
  showSendToCloud: false,
  displayModeBar: false
}

Plotly.newPlot("plot-year", data1, layout, config);
Plotly.newPlot("plot-object-of-search", data2, layout, config);
Plotly.newPlot("plot-legislation", data2, layout, config);
Plotly.newPlot("plot-outcome", data1, layout, config);
Plotly.newPlot("plot-footer", data3, layout1, config);
