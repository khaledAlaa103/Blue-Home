import test from 'node:test'
import assert from 'node:assert/strict'
import { customerRows, enforceCustomerLimits, USER_LIMIT } from './customers.js'

const now = new Date('2026-10-26T00:00:00.000Z')

test('lists signup customers and inquiry contacts without passwords', () => {
  const rows = customerRows({
    users: [
      { id: 'admin', username: 'admin', role: 'admin', phone: '', passwordHash: 'secret-admin' },
      { id: 'u1', username: 'sara', role: 'user', firstName: 'سارة', lastName: 'علي', phone: '01000000000', address: 'زايد', passwordHash: 'secret-user', createdAt: '2026-10-01T00:00:00.000Z' },
    ],
    inquiries: [
      { id: 'q1', name: 'محمد', phone: '01111111111', message: 'عايز شقة', listingId: 'l1', projectId: '', createdAt: '2026-10-02T00:00:00.000Z' },
    ],
    listings: [{ id: 'l1', title: 'شقة بلو' }],
    projects: [],
  }, now)
  assert.equal(rows.length, 2)
  assert.equal(rows[0].source, 'request')
  assert.equal(rows[1].source, 'signup')
  assert.equal(rows[1].name, 'سارة علي')
  assert.equal(JSON.stringify(rows).includes('secret'), false)
})

test('drops registrations older than two years and keeps the admin', () => {
  const db = {
    users: [
      { id: 'admin', username: 'admin', role: 'admin' },
      { id: 'old', role: 'user', username: 'old', createdAt: '2020-01-01T00:00:00.000Z' },
      { id: 'fresh', role: 'user', username: 'fresh', createdAt: '2026-01-01T00:00:00.000Z' },
    ],
    inquiries: [
      { id: 'old-request', createdAt: '2020-01-01T00:00:00.000Z' },
      { id: 'fresh-request', createdAt: '2026-06-01T00:00:00.000Z' },
    ],
  }
  enforceCustomerLimits(db, now)
  assert.deepEqual(db.users.map((user) => user.id), ['admin', 'fresh'])
  assert.deepEqual(db.inquiries.map((item) => item.id), ['fresh-request'])
})

test('replaces the oldest registration when the list reaches 10000', () => {
  const start = Date.parse('2025-01-01T00:00:00.000Z')
  const users = [{ id: 'admin', username: 'admin', role: 'admin' }]
  const inquiries = []
  for (let index = 0; index < USER_LIMIT; index += 1) {
    const createdAt = new Date(start + index * 1000).toISOString()
    users.push({ id: `user-${index}`, role: 'user', username: `user${index}`, createdAt })
    inquiries.push({ id: `request-${index}`, createdAt })
  }
  users.push({ id: 'newest-user', role: 'user', username: 'newest', createdAt: '2026-10-26T00:00:00.000Z' })
  inquiries.push({ id: 'newest-request', createdAt: '2026-10-26T00:00:00.000Z' })
  const db = { users, inquiries }
  enforceCustomerLimits(db, now)
  const accounts = db.users.filter((user) => user.role !== 'admin')
  assert.equal(accounts.length, USER_LIMIT)
  assert.equal(accounts.some((user) => user.id === 'newest-user'), true)
  assert.equal(accounts.some((user) => user.id === 'user-0'), false)
  assert.equal(db.users.some((user) => user.id === 'admin'), true)
  assert.equal(db.inquiries.length, USER_LIMIT)
  assert.equal(db.inquiries.some((item) => item.id === 'newest-request'), true)
  assert.equal(db.inquiries.some((item) => item.id === 'request-0'), false)
})
