import { writeFileSync } from 'node:fs'
import { readDb, enrichListing, enrichProject, publicSettings } from '../server/db.js'

const db = readDb()
const catalog = {
  settings: publicSettings(db.settings),
  areas: db.areas.map((area) => ({ id: area.id, name: area.name })),
  projects: db.projects.filter((project) => project.published).map((project) => enrichProject(db, project)),
  listings: db.listings.filter((item) => item.published).map((item) => enrichListing(db, item)),
  testimonials: db.testimonials.filter((item) => item.published && item.confirmed),
}

const text = JSON.stringify(catalog)
if (/password|jwt|MaiBlue/i.test(text)) {
  console.error('catalog contained a secret and was not written')
  process.exit(1)
}

writeFileSync(new URL('../src/catalog.json', import.meta.url), text)
console.log(`catalog ${catalog.projects.length} projects, ${catalog.listings.length} listings`)
