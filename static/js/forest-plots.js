import Plotly from '../vendor/plotly/js/plotly.esm.js'

function setup(id, _layout = {}) {
  const element = document.getElementById(id)
  if (!element) { return }

  const data = [
    {
      name: "RR",
      error_x: { type: "data", symmetric: false, color: "green", thickness: 3 },
      hoverinfo: "text",
      mode: "markers",
      type: "scatter",
      marker: { size: 10, color: "orange" }
    }
  ]

  const layout = Object.assign({}, {
    xaxis: { showline: true, zeroline: false, fixedrange: true },
    yaxis: { range: [0, 2], showgrid: false, zeroline: false, showticklabels: false, fixedrange: true },
    hoverlabel: { bgcolor: "lightgray" },
    showlegend: false,
    width: 600,
    height: 60,
    margin: { b: 0, l: 0, r: 0, t: 0 }
  }, _layout)

  const config = { showSendToCloud: false, displayModeBar: false }

  Plotly.newPlot(id, data, layout, config)
}

setup("plot-year")
setup("plot-object-of-search")
setup("plot-legislation")
setup("plot-outcome")
setup("plot-footer", { height: 30, margin: { b: 30, l: 0, r: 0, t: 0 } })

function getAllDataFloats(dataKey) {
  var elements = document.querySelectorAll(`[${dataKey}]`)

  return Array.from(elements).map(function(element) {
    return parseFloat(element.getAttribute(dataKey))
  })
}

function update(id) {
  const element = document.getElementById(id)
  if (!element) { return }

  const rr = parseFloat(element.getAttribute('data-rr'))
  const rr_ci_low = parseFloat(element.getAttribute('data-rr_ci_low'))
  const rr_ci_upp = parseFloat(element.getAttribute('data-rr_ci_upp'))

  const rr_min = Math.min(...getAllDataFloats('data-rr_ci_low'))
  const min    = Math.floor(rr_min) - 1

  const rr_max = Math.max(...getAllDataFloats('data-rr_ci_upp'))
  const max    = Math.ceil(rr_max) + 1

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

  Plotly.update(id, newData, newLayout)
}

function updateAll() {
  update("plot-year")
  update("plot-object-of-search")
  update("plot-legislation")
  update("plot-outcome")
  update("plot-footer")
}

export { updateAll }
