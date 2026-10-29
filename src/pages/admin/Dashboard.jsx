import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { useTitle } from '../../format'

export default function Dashboard() {
  useTitle('لوحة التحكم')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [areas, setAreas] = useState([])

  function load() {
    api.summary().then(setData).catch((err) => setError(err.message))
    api.bootstrap().then((result) => setAreas(result.areas)).catch(() => {})
  }
  useEffect(load, [])

  async function removeSamples() {
    if (!window.confirm('حذف كل البيانات التجريبية؟')) return
    await api.deleteSamples()
    load()
  }

  const max = Math.max(1, ...areas.map((area) => area.count))
  return (
    <>
      <div className="dash-title">
        <div><p className="kicker">بلو هوم</p><h1>إدارة العقارات</h1></div>
        <div className="actions">
          <Link className="btn btn-primary" to="/admin/listings">إضافة إعلان</Link>
          <Link className="btn btn-line" to="/admin/properties">إضافة عقار للبيع</Link>
        </div>
      </div>
      {error ? <p className="msg-err">{error}</p> : null}
      {data ? (
        <div className="stats">
          <article className="stat"><b>{data.available}</b><span>وحدة متاحة</span></article>
          <article className="stat"><b>{data.lands}</b><span>أرض متاحة</span></article>
          <article className="stat"><b>{data.properties ?? 0}</b><span>عقار للبيع</span></article>
          <article className="stat"><b>{data.unread}</b><span>طلب غير مقروء</span></article>
        </div>
      ) : null}
      <div className="split">
        <section className="panel">
          <h2>الإعلانات حسب المنطقة</h2>
          {areas.map((area) => (
            <div className="bar-row" key={area.id}>
              <span>{area.name}</span>
              <div className="meter"><span style={{ width: `${(area.count / max) * 100}%` }} /></div>
              <b>{area.count}</b>
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>ابدأ من هنا</h2>
          <p className="quiet">أضف رقم الهاتف وواتساب من الإعدادات حتى تظهر أزرار الاتصال في صفحات الإعلان.</p>
          <div className="actions">
            <Link className="btn btn-line" to="/admin/customers">العملاء {data ? `(${data.customers || 0})` : ''}</Link>
            <Link className="btn btn-line" to="/admin/inquiries">الطلبات {data ? `(${data.inquiries})` : ''}</Link>
            <Link className="btn btn-line" to="/admin/areas">المناطق</Link>
            <Link className="btn btn-line" to="/admin/settings">إعدادات التواصل</Link>
          </div>
          {data?.samples ? <button className="btn btn-danger" type="button" onClick={removeSamples}>حذف البيانات التجريبية ({data.samples})</button> : null}
        </section>
      </div>
    </>
  )
}
