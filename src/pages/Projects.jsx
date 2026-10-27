import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { bannerStyle } from '../banners'
import { ProjectCard } from '../components/Cards'
import { useTitle } from '../format'

export default function Projects() {
  useTitle('المشاريع')
  const [params, setParams] = useSearchParams()
  const [areas, setAreas] = useState([])
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const areaId = params.get('areaId') || ''
  const q = params.get('q') || ''

  useEffect(() => { api.bootstrap().then((data) => setAreas(data.areas)).catch(() => {}) }, [])
  useEffect(() => {
    api.projects({ areaId, q }).then((data) => setItems(data.items)).catch((err) => setError(err.message))
  }, [areaId, q])

  function update(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  return (
    <div className="container">
      <header className="page-head page-banner" style={bannerStyle('projects')}>
        <p className="crumbs">الرئيسية / المشاريع</p>
        <h1>المشاريع</h1>
        <p className="quiet">{items.length} مشروع منشور</p>
      </header>
      <div className="search-row" style={{ marginBottom: 16 }}>
        <select value={areaId} onChange={(event) => update('areaId', event.target.value)} aria-label="المنطقة">
          <option value="">كل المناطق</option>
          {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
        </select>
        <input value={q} onChange={(event) => update('q', event.target.value)} placeholder="اسم المشروع" aria-label="اسم المشروع" />
      </div>
      {error ? <p className="msg-err">{error}</p> : null}
      {!items.length ? <p className="empty">لا توجد مشاريع مطابقة.</p> : null}
      <div className="grid-cards three">{items.map((item) => <ProjectCard key={item.id} item={item} />)}</div>
    </div>
  )
}
