import test from 'node:test'
import assert from 'node:assert/strict'
import { applyFilters, paginate } from './filter.js'

const items = [
  { id: '1', published: true, type: 'شقة', areaId: 'october', operation: 'sale', projectId: 'p1', projectName: 'بلو ريزيدنس', status: 'available', price: 200, areaSqm: 100, rooms: 3, baths: 2, paymentType: 'installment', downPayment: 50, installmentMonths: 60, title: 'شقة بلو', description: '', areaName: '6 أكتوبر', address: '', createdAt: '2026-01-01' },
  { id: '2', published: true, type: 'فيلا', areaId: 'zayed', operation: 'sale', projectId: 'p2', projectName: 'حدائق', status: 'available', price: 900, areaSqm: 400, rooms: 5, baths: 4, paymentType: 'cash', downPayment: null, installmentMonths: null, title: 'فيلا', description: '', areaName: 'الشيخ زايد', address: '', createdAt: '2026-02-01' },
  { id: '3', published: false, type: 'أرض', areaId: 'october', operation: 'investment', projectId: '', projectName: '', status: 'available', price: 100, areaSqm: 500, rooms: null, baths: null, paymentType: 'cash', title: 'مخفية', description: '', areaName: '6 أكتوبر', address: '', createdAt: '2026-03-01' },
  { id: '4', published: true, type: 'أرض', areaId: 'new-october', operation: 'investment', projectId: '', projectName: '', status: 'sold', price: 300, areaSqm: 800, rooms: null, baths: null, paymentType: 'both', downPayment: 80, installmentMonths: 24, title: 'أرض', description: 'استثمار', areaName: 'أكتوبر الجديدة', address: '', createdAt: '2026-04-01' },
  { id: '5', published: true, type: 'محل تجاري', areaId: 'zayed', operation: 'sale', projectId: '', projectName: '', status: 'available', price: null, areaSqm: 50, rooms: null, baths: null, paymentType: 'cash', title: 'محل', description: '', areaName: 'الشيخ زايد', address: '', createdAt: '2026-05-01' },
]

test('hides unpublished listings from the public filter', () => {
  const ids = applyFilters(items, { publishedOnly: true }).map((item) => item.id)
  assert.deepEqual(ids.includes('3'), false)
  assert.equal(ids[0], '5')
})

test('splits units and lands', () => {
  assert.deepEqual(applyFilters(items, { publishedOnly: true, group: 'lands' }).map((item) => item.id), ['4'])
  assert.deepEqual(applyFilters(items, { publishedOnly: true, group: 'units', type: 'شقة' }).map((item) => item.id), ['1'])
})

test('filters price, rooms, payment, down payment, and duration', () => {
  assert.deepEqual(applyFilters(items, { publishedOnly: true, maxPrice: 250 }).map((item) => item.id), ['1'])
  assert.deepEqual(applyFilters(items, { publishedOnly: true, rooms: 4 }).map((item) => item.id), ['2'])
  assert.deepEqual(applyFilters(items, { publishedOnly: true, payment: 'installment' }).map((item) => item.id), ['4', '1'])
  assert.deepEqual(applyFilters(items, { publishedOnly: true, maxMonths: 30 }).map((item) => item.id), ['4'])
  assert.deepEqual(applyFilters(items, { publishedOnly: true, maxDown: 60 }).map((item) => item.id), ['1'])
})

test('searches by project name and keeps missing prices last', () => {
  assert.deepEqual(applyFilters(items, { publishedOnly: true, project: 'حدائق' }).map((item) => item.id), ['2'])
  const prices = applyFilters(items, { publishedOnly: true, sort: 'price_asc' }).map((item) => item.id)
  assert.equal(prices.at(-1), '5')
  assert.deepEqual(prices.slice(0, 3), ['1', '4', '2'])
})

test('paginates after filtering', () => {
  const filtered = applyFilters(items, { publishedOnly: true })
  const page = paginate(filtered, { page: 2, pageSize: 2 })
  assert.equal(page.total, 4)
  assert.equal(page.pages, 2)
  assert.equal(page.items.length, 2)
})
