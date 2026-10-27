import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api'
import { formatDate, waLink, useTitle } from '../../format'

const SOURCE = {
  signup: 'من Sign up',
  request: 'من تسجيل الطلب',
}

export default function CustomersAdmin() {
  useTitle('العملاء')
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [meta, setMeta] = useState({ limit: 10000, accounts: 0, requests: 0 })
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('all')

  useEffect(() => {
    api.customers().then((data) => {
      setItems(data.items)
      setMeta({ limit: data.limit || 10000, accounts: data.accounts || 0, requests: data.requests || 0 })
    }).catch((err) => setError(err.message))
  }, [])

  const shown = useMemo(() => {
    const text = query.trim()
    return items.filter((item) => {
      if (source !== 'all' && item.source !== source) return false
      if (!text) return true
      return `${item.name} ${item.phone} ${item.detail}`.includes(text)
    })
  }, [items, query, source])
  const signupCount = items.filter((item) => item.source === 'signup').length
  const requestCount = items.filter((item) => item.source === 'request').length

  return (
    <>
      <div className="dash-title">
        <div>
          <p className="kicker">لوحة التحكم</p>
          <h1>العملاء</h1>
        </div>
      </div>
      {error ? <p className="msg-err">{error}</p> : null}
      <div className="source-filters" role="group" aria-label="مصدر التسجيل">
        <button className={source === 'all' ? 'on' : ''} type="button" onClick={() => setSource('all')}>الكل ({items.length})</button>
        <button className={source === 'signup' ? 'on' : ''} type="button" onClick={() => setSource('signup')}>من Sign up ({signupCount})</button>
        <button className={source === 'request' ? 'on' : ''} type="button" onClick={() => setSource('request')}>من تسجيل الطلب ({requestCount})</button>
      </div>
      <label className="field">
        <span>بحث</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} inputMode="search" placeholder="اسم أو رقم موبايل" />
      </label>
      <div className="panel table-wrap">
        <table className="customers-table">
          <caption>Sign up {meta.accounts} من {meta.limit} · الطلبات {meta.requests} من {meta.limit} · سنتين ثم يتحذف الأقدم</caption>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>الاسم</th>
              <th>الموبايل</th>
              <th>المصدر</th>
              <th>التفاصيل</th>
              <th>حتى</th>
              <th>تواصل</th>
            </tr>
          </thead>
          <tbody>
            {!shown.length ? (
              <tr><td colSpan={7}>لا يوجد عملاء بعد.</td></tr>
            ) : shown.map((item) => {
              const call = item.phone ? `tel:${item.phone.replace(/[^\d+]/g, '')}` : ''
              const whatsapp = waLink(item.phone, `مرحباً ${item.name}، معك بلو هوم.`)
              return (
                <tr key={item.id}>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>{item.name}</td>
                  <td className="num">{item.phone ? <a href={call}>{item.phone}</a> : '—'}</td>
                  <td><span className={`source-badge source-${item.source}`}>{SOURCE[item.source] || item.source}</span></td>
                  <td>{item.detail || '—'}</td>
                  <td>{formatDate(item.expiresAt) || '—'}</td>
                  <td className="actions">
                    {call ? <a className="btn btn-line btn-sm" href={call}>اتصال</a> : null}
                    {whatsapp ? <a className="btn btn-navy btn-sm" href={whatsapp} target="_blank" rel="noreferrer">واتساب</a> : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
