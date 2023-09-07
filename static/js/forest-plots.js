import Plotly from '../vendor/plotly/js/plotly.esm.js'

function setup(element, _layout = {}) {
  if (!element) { return }

  const data = [
    {
      name: "RR",
      error_x: { type: "data", symmetric: false, color: "#046563", thickness: 3 },
      hoverinfo: "text",
      mode: "markers",
      type: "scatter",
      marker: { size: 10, color: "#046563" }
    }
  ]

  const layout = Object.assign({}, {
    xaxis: { showline: true, zeroline: false, fixedrange: true },
    yaxis: { range: [0, 2], showgrid: false, zeroline: false, showticklabels: false, fixedrange: true },
    hoverlabel: { bgcolor: "lightgray" },
    showlegend: false,
    height: 60,
    margin: { b: 0, l: 0, r: 0, t: 0 }
  }, _layout)

  const config = { responsive: true, showSendToCloud: false, displayModeBar: false }

  Plotly.newPlot(element, data, layout, config)
}

var plots = document.getElementsByClassName('js-plot')
for (var i = 0; i < plots.length; i++) {
  const element = plots.item(i)
  var layout = {};
  if (element.getAttribute('data-plot') == 'footer') {
    layout = { height: 30, margin: { b: 30, l: 0, r: 0, t: 0 } }
  }
  setup(plots.item(i), layout)
}

function getAllDataFloats(dataKey) {
  var elements = document.querySelectorAll(`[${dataKey}]`)

  return Array.from(elements).map(function(element) {
    return parseFloat(element.getAttribute(dataKey))
  })
}

function update(element, rr_min, rr_max) {
  if (!element) { return }

  const rr = parseFloat(element.getAttribute('data-rr'))
  const rr_ci_low = parseFloat(element.getAttribute('data-rr_ci_low'))
  const rr_ci_upp = parseFloat(element.getAttribute('data-rr_ci_upp'))

  const min = Math.floor(rr_min) - 1
  const max = Math.ceil(rr_max) + 1

  const newData = {}

  if (rr && rr_ci_low && rr_ci_upp) {
    Object.assign(newData, {
      x: [[rr]],
      y: [[1]],
      'error_x.array': [[rr_ci_upp - rr]],
      'error_x.arrayminus': [[rr - rr_ci_low]],
      text: [
        [`${rr.toFixed(2)}(${rr_ci_low.toFixed(2)},${rr_ci_upp.toFixed(2)})`]
      ]
    })
  }

  const newLayout = { 'xaxis.range': [min, max] }

  Plotly.update(element, newData, newLayout)
}

function updateAll(min, max) {
  var plots = document.getElementsByClassName('js-plot')
  for (var i = 0; i < plots.length; i++) {
    update(plots.item(i), min, max)
  }
}

export { updateAll }
