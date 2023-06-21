import { Modal } from '../vendor/bootstrap/js/bootstrap.esm.min.js'
import { createApp, toRaw } from '../vendor/vue/js/vue.esm-browser.prod.js'
import L from '../vendor/leaflet/js/leaflet-1.8.0.esm.js'
import { getData } from './data.js'
import councils from './councils.esm.js'
import policeForces from './police-forces.esm.js'

const app = createApp({
  delimiters: ['${', '}'],
  data() {
    return {
      currentType: 'filter',
      boundaryType: 'council',
      boundaryData: null,
      selectedFilters: [],
      selectedShader: null,
      shaderSeries: [],
      geojson: null,
      map: null,
      browseDatasets: false,
      filters: [{
        name: "rr",
        title: "Disproportionally",
        desc: "The ratio of disproportate stops between black and white ethnicities",
        comparators: {
          "lt": "is less than",
          "gte": "is equal or more than"
        },
        defaultComparator: 'gte',
        defaultValue: "1"
      }, {
        name: "black-stop-rate",
        title: "Black stop rate",
        desc: "Percentage of the black population which have been stopped",
        comparators: {
          "lt": "is less than",
          "gte": "is equal or more than"
        },
        defaultValue: "1"
      }, {
        name: "white-stop-rate",
        title: "White stop rate",
        desc: "Percentage of the white population which have been stopped",
        comparators: {
          "lt": "is less than",
          "gte": "is equal or more than"
        },
        defaultValue: "0.5"
      }]
    }
  },
  watch: {
    selectedFilters: {
      handler(newValue, oldValue) { this.updateState() },
      deep: true,
    },
    selectedShader: {
      handler(newValue, oldValue) { this.updateState() },
    },
    boundaryType: {
      handler(newValue, oldValue) { this.updateState() },
    },
  },
  computed: {
    modal() {
      return new Modal(this.$refs.modal)
    },
  },
  mounted() {
    this.restoreState()

    this.cacheBoundaryData().
      then(this.setUpMap).
      then(this.updateFeatures)

    this.$refs.filtersContainer.removeAttribute('hidden')
    this.$refs.shaderContainer.removeAttribute('hidden')
    this.$refs.modal.addEventListener('hidden.bs.modal', (e) => {
      this.browseDatasets = false
    })
  },
  methods: {
    changeBoundary(newBoundaryType) {
      this.boundaryType = newBoundaryType
      this.updateFeatures()
    },
    selectFilter() {
      this.currentType = 'filter'
      this.modal.show()
    },
    selectShader() {
      this.currentType = 'shader'
      this.modal.show()
    },
    addFilterOrShader(name) {
      switch (this.currentType) {
        case 'filter': this.addFilter(name); break
        case 'shader': this.addShader(name); break
      }
      this.modal.hide()
    },
    addFilter(filterName, current = {}) {
      const filter = this.getFilter(filterName)

      filter.selectedComparator = current.comparator ||
        filter.defaultComparator || Object.keys(filter.comparators)[0]
      filter.selectedValue = current.value || filter.defaultValue

      if (!filter.selectedValue && filter.options) {
        filter.selectedValue = filter.options[0]
      }

      this.selectedFilters.push(filter)
    },
    getFilter(filterName) {
      return this.filters.filter(f => f.name == filterName)[0]
    },
    removeFilter(filterName) {
      this.selectedFilters = this.selectedFilters.filter(f => f.name != filterName)
    },
    addShader(shaderName) {
      this.selectedShader = this.getFilter(shaderName)
    },
    removeShader(_shaderName) {
      this.selectedShader = null
    },
    toggleBrowseDatasets() {
      this.browseDatasets = !this.browseDatasets
    },
    state() {
      const state = {}

      this.selectedFilters.forEach(function(d) {
        state[`${d.name}__${d.selectedComparator}`] = d.selectedValue
      })

      if (this.selectedShader) { state['shader'] = this.selectedShader.name }
      state['type'] = this.boundaryType

      return state
    },
    url(pathname = window.location.pathname) {
      const url = new URL(window.location.origin + pathname)

      for (const [key, value] of Object.entries(this.state())) {
        url.searchParams.set(key, value)
      }

      return url
    },
    updateState() {
      window.history.replaceState(this.state(), '', this.url())
      this.updateFeatures()
    },
    restoreState() {
      const params = new URL(window.location).searchParams

      for (const [key, value] of params.entries()) {
        if (key == 'type') {
          this.boundaryType = value
        } else if (key == 'shader') {
          this.addShader(value)
        } else {
          const index = key.indexOf('__')
          const name = key.slice(0, index)
          const comparator = key.slice(index + 2)
          this.addFilter(name, { comparator, value })
        }
      }
    },
    setUpMap() {
      this.map = L.map(this.$refs.map).setView([52.417, -2.353], 7)

      var tiles = L.tileLayer(
        'https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=7ac28b44c7414ced98cd4388437c718d',
        {
          maxZoom: 19,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
      ).addTo(this.map)
    },
    boundaries() {
      switch(this.boundaryType) {
        case 'council': return councils
        case 'police-force': return policeForces
      }
    },
    cacheBoundaryData() {
      const that = this
      return getData({
        'date = ?': 0,
        'metric IN (?, ?)': ['rr', 'stop_rate']
      }).then(function(data) {
        that.boundaryData = data.reduce((acc, obj) => {
          const { area_id, metric, metric_category, ethnicity, value } = obj
          if (!acc[area_id]) { acc[area_id] = {} }
          if (metric === 'stop_rate') {
            acc[area_id][`${ethnicity.toLowerCase()}-stop-rate`] = value
          } else if (metric === 'rr' && metric_category == 'rr') {
            acc[area_id][metric] = value
          }
          return acc
        }, {})
      })
    },
    shouldShowBoundary(id) {
      return (this.boundaryData[id]) ? this.boundaryData[id].visible : true
    },
    getShadeForBoundary(id) {
      if (!this.selectedShader) { return '#ed6832' }

      function interpolate(value1, value2, percentage) {
        return Math.round(value1 + (value2 - value1) * (percentage / 100));
      }

      function getColorShade(percentage) {
        const colour = {
          r: interpolate(245, 120, percentage),
          g: interpolate(170,  42, percentage),
          b: interpolate(140,  10, percentage)
        }

        return `rgb(${colour.r},${colour.g},${colour.b})`
      }

      const value = this.boundaryData[id][this.selectedShader.name]

      const series = toRaw(this.shaderSeries)
      const index = series.findIndex((v) => v === value)

      const percentage = Math.round((index / series.length) * 100);
      const roundedPercentage = Math.round(percentage / 10) * 10;

      return getColorShade(roundedPercentage)
    },
    updateVisibleBoundaries() {
      const that = this
      Object.keys(this.boundaryData).forEach(key => {
        that.boundaryData[key].visible = that.selectedFilters.map(function (filter) {
          const value = that.boundaryData[key][filter.name]
          if (filter.selectedComparator == 'lt' && value >= filter.selectedValue) { return false }
          if (filter.selectedComparator == 'gte' && value < filter.selectedValue) { return false }
          return true
        }).every(Boolean)
      })

      this.updateShaderRanges()
    },
    updateShaderRanges() {
      this.shaderSeries = []
      if (!this.selectedShader) { return }

      const visibleBoundaries = Object.values(this.boundaryData).
        filter((boundary) => boundary.visible)

      this.shaderSeries = visibleBoundaries.map(boundary => {
        return boundary[this.selectedShader.name]
      }).sort((a, b) => a - b)
    },
    updateFeatures() {
      if (!this.map) { return }

      if (this.geojson) {
        this.geojson.off()
        this.geojson.remove()
      }

      this.updateVisibleBoundaries()

      this.geojson = L.geoJson(this.boundaries(), {
        style: (boundary) => {
          return {
            fillColor: this.getShadeForBoundary(boundary.properties.id),
            fillOpacity: 0.7,
            color: 'white',
            weight: 2,
            opacity: 1,
          }
        },
        filter: (boundary) => {
          return this.shouldShowBoundary(boundary.properties.id)
        },
        onEachFeature: (boundary, layer) => {
          layer.bindTooltip(boundary.properties.name)
          layer.on({
            mouseover: (e) => { e.target.setStyle({ weight: 5 }) },
            mouseout: (e) => { e.target.setStyle({ weight: 2}) },
            click: (e) => {
              window.location.href = `area?id=${boundary.properties.id}&type=${boundary.properties.type}`
            },
          })
        }
      }).addTo(this.map)
    },
  }
})

app.mount('#exploreApp')
