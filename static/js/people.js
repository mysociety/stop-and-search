import { createApp } from '../vendor/vue/js/vue.esm-browser.prod.js'
import { getArea, getQuery } from './data.js'

const app = createApp({
  delimiters: ['${', '}'],
  data() {
    return {
      area: null,
      people: [],
    }
  },
  computed: {
    mps() {
      return this.people.filter(p => p.type === 'mp')
    },
    pcc() {
      return this.people.filter(p => p.type === 'pcc')[0] || {}
    },
  },
  async created() {
    const params = new URLSearchParams(document.location.search)
    this.area = await getArea({ 'id = ?': params.get('id'), 'type = ?': params.get('type') })

    const query = `
      SELECT DISTINCT p.id, p.name, p.title, p.type, ap.area_id, GROUP_CONCAT(JSON_OBJECT(pi.type, pi.value)) AS identifiers
      FROM people p
      JOIN area_people ap ON ap.person_id = p.id
      JOIN person_identifiers pi ON pi.person_id = p.id
      JOIN area_intersections ai ON ai.area_id = ap.area_id OR ai.intersected_area_id = ap.area_id
      WHERE ai.area_id = :id OR ai.intersected_area_id = :id
      GROUP BY p.id, p.name, p.title
      ORDER BY p.title;
    `
    this.people = await getQuery(query, { ':id': this.area.id })
  },
  methods: {
    getIndentifer(person, identifier) {
      const identifiers = Object.assign({}, ...JSON.parse(`[${person.identifiers || []}]`))
      return identifiers[identifier]
    }
  },
})

app.mount('#people')
