import Plotly from '../vendor/plotly/js/plotly.esm.js'

function setup(id) {
  const element = document.getElementById(id)
  if (!element) { return }

  const title = element.getAttribute('data-title')
  // const sourceData = {
  //   y: ['foo', 'bar'], // ethnicities
  //   x: { a: [1, 4], b: [6, 9] }, // a/b = categories
  // }
  const sourceData = JSON.parse(element.getAttribute('data-source'))

  console.log(sourceData)

  const data = Object.keys(sourceData.x).map((category) => {
    return {
      name: category,
      text: sourceData.x[category].map((d) => `${d}%`),
      x: sourceData.x[category],
      y: sourceData.y.map((y) => `${y.replace('_', ' ')} `),
      hoverinfo: 'none',
      type: 'bar',
      orientation: 'h'
    }
  })

  const layout = {
    xaxis: { visible: false },
    legend: { orientation: 'h', traceorder: 'normal' },
    height: 500,
    margin: { b: 0, l: 100, r: 0, t: 0 },
    barmode: 'stack'
  }

  const config = { responsive: true, showSendToCloud: false, displayModeBar: false }

  Plotly.newPlot(id, data, layout, config)
}

function setupAll() {
  setup("bar-object-of-search")
  setup("bar-legislation")
  setup("bar-outcome")
}

export { setupAll }
