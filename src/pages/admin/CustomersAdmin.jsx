import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../api'
import { formatDate, waLink, useTitle } from '../../format'

const SOURCE = {
  signup: 'من Sign up',
  request: 'من تسجيل الطلب',
}

export default function CustomersAdmin() {
  useTitle('العملاء')
  const [items, setItems] = useState([])
  const [blocked, setBlockedList] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')
  const [meta, setMeta] = useState({ limit: 10000, accounts: 0, requests: 0 })
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('all')

  const load = useCallback(() => api.customers().then((data) => {
    setItems(data.items)
    setBlockedList(data.blocked || [])
    setMeta({ limit: data.limit || 10000, accounts: data.accounts || 0, requests: data.requests || 0 })
  }).catch((err) => setError(err.message)), [])

  useEffect(() => { load() }, [load])

  async function run(key, work, message) {
    setBusy(key)
    setError('')
    setNotice('')
    try {
      await work()
      await load()
      setNotice(message)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  function remove(item) {
    const what = item.source === 'signup' ? 'حساب' : 'طلب'
    if (!window.confirm(`حذف ${what} «${item.name}»؟ مش هتقدر ترجّعه.`)) return
    run(`del-${item.id}`, () => api.deleteCustomer(item.id), `اتحذف ${what} ${item.name}.`)
  }

  function toggleBlock(item) {
    if (!item.blocked && !window.confirm(`بلوك لـ «${item.name}»؟ مش هيقدر يدخل أو يسجّل أو يبعت طلبات تاني بأي بيان كتبه: الاسم أو الموبايل أو اسم المستخدم أو العنوان.`)) return
    run(`block-${item.id}`, () => api.blockCustomer(item.id, !item.blocked), item.blocked ? `اتلغى البلوك عن ${item.name}.` : `اتعمل بلوك لـ ${item.name}.`)
  }

  function unblock(entry) {
    run(`unblock-${entry.id}`, () => api.unblockEntry(entry.id), `اتلغى البلوك عن ${entry.label || entry.phoneShown}.`)
  }

  const shown = useMemo(() => {
    const text = query.trim()
    return items.filter((item) => {
      if (source === 'blocked' ? !item.blocked : source !== 'all' && item.source !== source) return false
      if (!text) return true
      return `${item.name} ${item.phone} ${item.detail}`.includes(text)
    })
  }, [items, query, source])
  const signupCount = items.filter((item) => item.source === 'signup').length
  const requestCount = items.filter((item) => item.source === 'request').length
  const blockedCount = items.filter((item) => item.blocked).length

  return (
    <>
      <div className="dash-title">
        <div>
          <p className="kicker">لوحة التحكم</p>
          <h1>العملاء</h1>
        </div>
      </div>
      {error ? <p className="msg-err">{error}</p> : null}
      {notice ? <p className="msg-ok">{notice}</p> : null}
      <div className="source-filters" role="group" aria-label="مصدر التسجيل">
        <button className={source === 'all' ? 'on' : ''} type="button" onClick={() => setSource('all')}>الكل ({items.length})</button>
        <button className={source === 'signup' ? 'on' : ''} type="button" onClick={() => setSource('signup')}>من Sign up ({signupCount})</button>
        <button className={source === 'request' ? 'on' : ''} type="button" onClick={() => setSource('request')}>من تسجيل الطلب ({requestCount})</button>
        <button className={source === 'blocked' ? 'on' : ''} type="button" onClick={() => setSource('blocked')}>محظورين ({blockedCount})</button>
      </div>
      <label className="field">
        <span>بحث</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} inputMode="search" placeholder="اسم أو رقم موبايل" />
      </label>
      {blocked.length ? (
        <section className="panel blocked-list">
          <h2>المحظورين ({blocked.length})</h2>
          <ul>
            {blocked.map((entry) => (
              <li key={entry.id}>
                <span>
                  <b>{entry.label || '—'}</b>
                  {[entry.phoneShown && <bdi key="p" dir="ltr">{entry.phoneShown}</bdi>, entry.usernameShown && <bdi key="u" dir="ltr">@{entry.usernameShown}</bdi>].filter(Boolean).map((part, index) => <span key={index} className="quiet"> · {part}</span>)}
                </span>
                <button className="btn btn-line btn-sm" type="button" disabled={busy === `unblock-${entry.id}`} onClick={() => unblock(entry)}>إلغاء البلوك</button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
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
              <th>إدارة</th>
            </tr>
          </thead>
          <tbody>
            {!shown.length ? (
              <tr><td colSpan={8}>لا يوجد عملاء بعد.</td></tr>
            ) : shown.map((item) => {
              const call = item.phone ? `tel:${item.phone.replace(/[^\d+]/g, '')}` : ''
              const whatsapp = waLink(item.phone, `مرحباً ${item.name}، معك بلو هوم.`)
              return (
                <tr key={item.id} className={item.blocked ? 'is-blocked' : ''}>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>{item.name}{item.blocked ? <span className="blocked-badge">محظور</span> : null}</td>
                  <td className="num">{item.phone ? <a href={call}>{item.phone}</a> : '—'}</td>
                  <td><span className={`source-badge source-${item.source}`}>{SOURCE[item.source] || item.source}</span></td>
                  <td>{item.detail || '—'}</td>
                  <td>{formatDate(item.expiresAt) || '—'}</td>
                  <td><div className="actions">
                    {call ? <a className="btn btn-line btn-sm" href={call}>اتصال</a> : null}
                    {whatsapp ? <a className="btn btn-navy btn-sm" href={whatsapp} target="_blank" rel="noreferrer">واتساب</a> : null}
                  </div></td>
                  <td><div className="actions">
                    <button className={item.blocked ? 'btn btn-line btn-sm' : 'btn btn-warn btn-sm'} type="button" disabled={Boolean(busy)} onClick={() => toggleBlock(item)}>
                      {item.blocked ? 'إلغاء البلوك' : 'بلوك'}
                    </button>
                    <button className="btn btn-danger btn-sm" type="button" disabled={Boolean(busy)} onClick={() => remove(item)}>حذف</button>
                  </div></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
