import { useEffect, useState } from 'react'
import { api } from '../api'
import { bannerStyle } from '../banners'
import { useTitle } from '../format'

// The whole page body comes from the admin's "من نحن" setting; each line is its own paragraph.
export default function About() {
  useTitle('من نحن')
  const [about, setAbout] = useState(null)
  useEffect(() => { api.bootstrap().then((data) => setAbout(data.settings.about || '')).catch(() => setAbout('')) }, [])
  const paragraphs = (about || '').split(/\n+/).map((line) => line.trim()).filter(Boolean)
  return (
    <div className="container narrow">
      <header className="page-head page-banner" style={bannerStyle('about')}>
        <p className="kicker">بلو هوم</p>
        <h1>من نحن</h1>
      </header>
      {paragraphs.length ? (
        <div className="panel about-body">
          {paragraphs.map((text, index) => <p key={index}>{text}</p>)}
        </div>
      ) : null}
    </div>
  )
}
