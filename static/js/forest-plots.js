import Plotly from '../vendor/plotly/js/plotly.esm.js'

function setup(id, _layout = {}) {
  const data = [
    {
      name: "OR",
      error_x: { type: "data", symmetric: false, color: "green", thickness: 3 },
      hoverinfo: "text",
      mode: "markers",
      type: "scatter",
      marker: { size: 10, color: "blue" }
    }, {
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
    yaxis: { range: [0, 3], showgrid: false, zeroline: false, showticklabels: false, fixedrange: true },
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

  const or = parseFloat(element.getAttribute('data-or'))
  const or_ci_low = parseFloat(element.getAttribute('data-or_ci_low'))
  const or_ci_upp = parseFloat(element.getAttribute('data-or_ci_upp'))

  const rr = parseFloat(element.getAttribute('data-rr'))
  const rr_ci_low = parseFloat(element.getAttribute('data-rr_ci_low'))
  const rr_ci_upp = parseFloat(element.getAttribute('data-rr_ci_upp'))

  const or_min = Math.min(...getAllDataFloats('data-or_ci_low'))
  const rr_min = Math.min(...getAllDataFloats('data-rr_ci_low'))
  const min    = Math.floor(Math.min(or_min, rr_min)) - 1

  const or_max = Math.max(...getAllDataFloats('data-or_ci_upp'))
  const rr_max = Math.max(...getAllDataFloats('data-rr_ci_upp'))
  const max    = Math.ceil(Math.max(or_max, rr_max)) + 1

  const newData = {}

  if (or && or_ci_low && or_ci_upp && rr && rr_ci_low && rr_ci_upp) {
    Object.assign(newData, {
      x: [[or], [rr]],
      y: [[2], [1]],
      'error_x.array': [[or_ci_upp - or], [rr_ci_upp - rr]],
      'error_x.arrayminus': [[or - or_ci_low], [rr - rr_ci_low]],
      text: [
        [`${or.toFixed(2)}(${or_ci_low.toFixed(2)},${or_ci_upp.toFixed(2)})`],
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
