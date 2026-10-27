import test from 'node:test'
import assert from 'node:assert/strict'
import { customerRows, deleteCustomer, enforceCustomerLimits, isBlocked, phoneKey, setRowBlocked, textKey, unblockEntry, USER_LIMIT } from './customers.js'

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

test('a block remembers every Sign up field, so changing one does not get back in', () => {
  assert.equal(phoneKey('+20 100 000 0000'), '01000000000')
  assert.equal(phoneKey('00201000000000'), '01000000000')
  assert.equal(textKey('سارة  أحمد'), textKey('ساره احمد'))
  const db = {
    users: [{ id: 'u1', username: 'Sara1', role: 'user', firstName: 'سارة', lastName: 'أحمد', phone: '01000000000', address: '6 أكتوبر، الحي الأول' }],
    inquiries: [],
  }
  assert.equal(setRowBlocked(db, 'user-u1', true, now), true)
  assert.equal(isBlocked(db, db.users[0]), true)
  assert.equal(isBlocked(db, { phone: '+201000000000' }), true)
  assert.equal(isBlocked(db, { phone: '01999999999', username: 'sara1' }), true)
  assert.equal(isBlocked(db, { phone: '01999999999', username: 'new', firstName: 'ساره', lastName: 'احمد' }), true)
  assert.equal(isBlocked(db, { phone: '01999999999', username: 'new', firstName: 'منى', lastName: 'علي', address: '6 اكتوبر الحي الاول' }), true)
  assert.equal(isBlocked(db, { phone: '01999999999', username: 'new', firstName: 'منى', lastName: 'علي', address: 'زايد' }), false)
  assert.equal(isBlocked(db, { name: 'سارة أحمد', phone: '01888888888' }), true)
  assert.equal(setRowBlocked(db, 'user-u1', false, now), true)
  assert.equal(isBlocked(db, db.users[0]), false)
  setRowBlocked(db, 'user-u1', true, now)
  assert.equal(unblockEntry(db, db.blocked[0].id), true)
  assert.equal((db.blocked || []).length, 0)
  assert.equal(setRowBlocked(db, 'user-missing', true, now), false)
})

test('deletes a signup or a request by row id, never the admin', () => {
  const db = {
    users: [
      { id: 'admin', username: 'admin', role: 'admin' },
      { id: 'u1', username: 'sara', role: 'user', phone: '01000000000' },
    ],
    inquiries: [{ id: 'q1', name: 'منى', phone: '01111111111' }],
  }
  assert.equal(deleteCustomer(db, 'user-u1'), true)
  assert.equal(deleteCustomer(db, 'inquiry-q1'), true)
  assert.equal(deleteCustomer(db, 'user-admin'), false)
  assert.equal(deleteCustomer(db, 'user-missing'), false)
  assert.deepEqual(db.users.map((user) => user.id), ['admin'])
  assert.equal(db.inquiries.length, 0)
  const rows = customerRows({ users: [{ id: 'u2', role: 'user', phone: '01222222222', createdAt: '2026-10-01T00:00:00.000Z' }], inquiries: [], blocked: [{ id: 'b', phone: '01222222222' }] }, now)
  assert.equal(rows[0].blocked, true)
})
