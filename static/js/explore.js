import { Modal } from '../vendor/bootstrap/js/bootstrap.esm.min.js'
import { createApp } from '../vendor/vue/js/vue.esm-browser.prod.js'
import L from '../vendor/leaflet/js/leaflet-1.8.0.esm.js'
import councils from './councils.esm.js'
import policeForces from './police-forces.esm.js'

const app = createApp({
  delimiters: ['${', '}'],
  data() {
    return {
      currentType: 'filter',
      boundaryType: 'council',
      selectedFilters: [],
      selectedShader: null,
      geojson: null,
      map: null,
      browseDatasets: false,
      filters: [{
        name: "year",
        title: "Year",
        desc: "Filter data to a specific year or years",
        comparators: {
          "year": "equal to",
          "lt": "before",
          "lte": "before or equal to",
          "gt": "since",
          "gte": "equal to or since"
        },
        options: [
          "2019",
          "2020",
          "2021",
          "2022",
          "2023"
        ]
      }, {
        name: "black-stop-rate",
        title: "Black stop rate",
        desc: "Percentage of the black population which have been stopped",
        comparators: {
          "lt": "is less than",
          "gte": "is more than"
        },
        defaultValue: "50"
      }, {
        name: "black-non-stop-rate",
        title: "Black non-stop rate",
        desc: "Percentage of the black population which have not been stopped",
        comparators: {
          "lt": "is less than",
          "gte": "is more than"
        },
        defaultValue: "50"
      }, {
        name: "white-stop-rate",
        title: "White stop rate",
        desc: "Percentage of the white population which have been stopped",
        comparators: {
          "lt": "is less than",
          "gte": "is more than"
        },
        defaultValue: "50"
      }, {
        name: "white-non-stop-rate",
        title: "White non-stop rate",
        desc: "Percentage of the white population which have not been stopped",
        comparators: {
          "lt": "is less than",
          "gte": "is more than"
        },
        defaultValue: "50"
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

    Promise.resolve().
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
      Promise.resolve().then(this.updateFeatures)
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
        Object.keys(filter.comparators)[0]
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
    updateFeatures() {
      if (this.geojson) {
        this.geojson.off()
        this.geojson.remove()
      }

      this.geojson = L.geoJson(this.boundaries(), {
        style: (boundary) => {
          return {
            fillColor: '#ed6832',
            fillOpacity: 0.7,
            color: 'white',
            weight: 2,
            opacity: 1,
          }
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
