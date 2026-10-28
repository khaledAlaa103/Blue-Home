import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { ListingCard } from '../components/Cards'
import { Gallery } from '../components/Gallery'
import { InquiryForm } from '../components/InquiryForm'
import { formatDate, coordsOf, mapLink, useTitle, videoEmbed, directVideo } from '../format'
import { PropertyMap } from '../components/PropertyMap'

export default function ProjectDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const project = data?.project
  useTitle(project?.name || 'المشروع')

  useEffect(() => {
    api.project(id, params.get('preview') === '1').then(setData).catch((err) => setError(err.message))
  }, [id, params])

  if (error) return <p className="container msg-err">{error}</p>
  if (!project) return <p className="container state">جارٍ التحميل…</p>
  const embed = videoEmbed(project.videoUrl)
  const file = directVideo(project.videoUrl)
  const map = coordsOf(project.lat, project.lng)
  return (
    <div className="container">
      <header className="page-head">
        <p className="crumbs"><Link to="/">الرئيسية</Link> / <Link to="/projects">المشاريع</Link> / {project.name}</p>
        <h1>{project.name}</h1>
        <p className="quiet">{project.areaName}{project.developer ? ` · ${project.developer}` : ''}</p>
      </header>
      <div className="detail">
        <div className="detail-main">
          <Gallery images={project.images || []} title={project.name} />
          {project.description ? <section className="section"><h2>عن المشروع</h2><p>{project.description}</p></section> : null}
          {project.features?.length ? <ul className="feature-list">{project.features.map((item) => <li key={item}>{item}</li>)}</ul> : null}
          {embed ? <iframe className="video" src={embed} title="فيديو المشروع" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : null}
          {file ? <video className="video" src={file} controls playsInline preload="metadata" /> : null}
          {project.virtualTourUrl ? <p><a className="btn btn-line" href={project.virtualTourUrl} target="_blank" rel="noreferrer">الجولة الافتراضية</a></p> : null}
          {map ? (
            <section>
              <h2>الموقع</h2>
              <PropertyMap coords={map} label={project.name} title={`موقع ${project.name}`} />
              <a className="btn btn-line map-open" href={mapLink(project.lat, project.lng)} target="_blank" rel="noreferrer">فتح في خرائط جوجل</a>
            </section>
          ) : null}
          <section className="section">
            <h2>وحدات المشروع</h2>
            {data.listings?.length ? <div className="grid-cards">{data.listings.map((item) => <ListingCard key={item.id} item={item} />)}</div> : <p className="empty">لا توجد وحدات منشورة داخل هذا المشروع.</p>}
          </section>
        </div>
        <aside className="facts">
          <dl className="kv">
            {project.address ? <div><dt>العنوان</dt><dd>{project.address}</dd></div> : null}
            <div><dt>آخر تحديث</dt><dd>{formatDate(project.updatedAt)}</dd></div>
          </dl>
          <InquiryForm projectId={project.id} allowViewing />
        </aside>
      </div>
    </div>
  )
}
