import Plotly from '../vendor/plotly/js/plotly.esm.js'

function setup(id) {
  const element = document.getElementById(id)
  if (!element) { return }

  const title = element.getAttribute('data-title')

  const blackData = JSON.parse(element.getAttribute('data-Black'))
  const whiteData = JSON.parse(element.getAttribute('data-White'))

  const data = Object.keys(blackData).map((key) => {
    return {
      name: key,
      text: [`${blackData[key]}%`, `${whiteData[key]}%`],
      x: [blackData[key], whiteData[key]],
      y: ['Black ', 'White '],
      hoverinfo: 'none',
      type: 'bar',
      orientation: 'h'
    }
  })

  const layout = {
    xaxis: { visible: false },
    legend: { orientation: 'h', traceorder: 'normal' },
    height: 250,
    margin: { b: 0, l: 50, r: 0, t: 0 },
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
