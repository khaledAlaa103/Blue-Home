import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { bannerStyle } from '../banners'
import { ListingCard } from '../components/Cards'
import { Filters, FILTER_KEYS } from '../components/Filters'
import { ResultsMap } from '../components/ResultsMap'
import { useTitle } from '../format'
import { useLang } from '../i18n'

function readForm(params) {
  const form = {}
  FILTER_KEYS.forEach((key) => { form[key] = params.get(key) || '' })
  if (!form.sort) form.sort = 'newest'
  return form
}

export default function Listings({ group, title }) {
  useTitle(title)
  const { t } = useLang()
  const [params, setParams] = useSearchParams()
  const [form, setForm] = useState(() => readForm(params))
  const [meta, setMeta] = useState({ areas: [], projects: [] })
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const queryKey = params.toString()

  useEffect(() => { setForm(readForm(params)) }, [queryKey])
  useEffect(() => { api.bootstrap().then(setMeta).catch(() => {}) }, [])
  useEffect(() => {
    const query = Object.fromEntries(params.entries())
    query.group = group
    let live = true
    setLoading(true)
    api.listings(query).then((result) => { if (live) setData(result) }).catch((err) => { if (live) setError(err.message) }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [queryKey, group])

  const items = data?.items || []
  const roomValue = params.get('rooms') || ''
  const chips = useMemo(() => ['', '1', '2', '3', '4'], [])

  function apply(event) {
    event.preventDefault()
    const next = new URLSearchParams()
    FILTER_KEYS.forEach((key) => { if (form[key]) next.set(key, form[key]) })
    setParams(next)
    setFiltersOpen(false)
  }

  function setRoom(value) {
    const next = new URLSearchParams(params)
    if (value) next.set('rooms', value)
    else next.delete('rooms')
    next.delete('page')
    setParams(next)
  }

  function pageTo(page) {
    const next = new URLSearchParams(params)
    next.set('page', String(page))
    setParams(next)
  }

  return (
    <div className="container">
      <header className="page-head page-banner" style={bannerStyle(group)}>
        <p className="crumbs">{t('الرئيسية')} / {t(title)}</p>
        <h1>{t(title)}</h1>
        <p className="quiet">{loading ? t('جارٍ التحميل…') : t(`${data?.total || 0} نتيجة`)}</p>
      </header>
      <div className="tool-row">
        <button className="filter-toggle" type="button" onClick={() => setFiltersOpen(true)}>{t('تصفية')}</button>
        <button className="map-toggle" type="button" onClick={() => setMapOpen(true)}>{t('الخريطة')}</button>
      </div>
      <div className="results-layout">
        <Filters
          areas={meta.areas}
          projects={meta.projects}
          values={form}
          onChange={setForm}
          onSubmit={apply}
          onReset={() => { setForm(readForm(new URLSearchParams())); setParams(new URLSearchParams()) }}
          onClose={filtersOpen ? () => setFiltersOpen(false) : null}
          group={group}
        />
        {!filtersOpen ? null : null}
        <section>
          {group !== 'lands' && group !== 'properties' ? (
            <div className="chips" aria-label={t('عدد الغرف')}>
              {chips.map((chip) => (
                <button key={chip || 'all'} type="button" className={roomValue === chip ? 'on' : ''} onClick={() => setRoom(chip)}>{chip ? t(`${chip}+ غرف`) : t('كل الغرف')}</button>
              ))}
            </div>
          ) : null}
          {error ? <p className="msg-err">{error}</p> : null}
          {!loading && !items.length ? <p className="empty">{t('لا توجد نتائج مطابقة. وسّع السعر أو امسح بعض الفلاتر.')}</p> : null}
          <div className="grid-cards">{items.map((item) => <ListingCard key={item.id} item={item} />)}</div>
          {data && data.pages > 1 ? (
            <div className="pager">
              <button className="btn btn-line" type="button" disabled={data.page <= 1} onClick={() => pageTo(data.page - 1)}>{t('السابق')}</button>
              <span>{t(`صفحة ${data.page} من ${data.pages}`)}</span>
              <button className="btn btn-line" type="button" disabled={data.page >= data.pages} onClick={() => pageTo(data.page + 1)}>{t('التالي')}</button>
            </div>
          ) : null}
        </section>
        <aside className={mapOpen ? 'map-card map-pane open' : 'map-card map-pane'}>
          {mapOpen ? <button className="btn btn-line sheet-close" type="button" onClick={() => setMapOpen(false)}>{t('إغلاق الخريطة')}</button> : null}
          <ResultsMap items={items} active={mapOpen} />
          {!items.some((item) => item.lat != null) ? <p className="quiet">{t('لا توجد إحداثيات للنتائج الحالية، والخريطة توضح نطاق غرب القاهرة.')}</p> : null}
        </aside>
      </div>
    </div>
  )
}
