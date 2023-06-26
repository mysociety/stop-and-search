import Plotly from '../vendor/plotly/js/plotly.esm.js'

function setup(id, _layout = {}) {
  const element = document.getElementById(id)
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

function update(id, rr_min, rr_max) {
  const element = document.getElementById(id)
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

  Plotly.update(id, newData, newLayout)
}

function updateAll(min, max) {
  update("plot-year", min, max)
  update("plot-object-of-search", min, max)
  update("plot-legislation", min, max)
  update("plot-outcome", min, max)
  update("plot-footer", min, max)
}

export { updateAll }
