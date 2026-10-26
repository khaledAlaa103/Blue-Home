import { useEffect, useState } from 'react'
import { api } from '../api'
import { useTitle } from '../format'

export default function About() {
  useTitle('من نحن')
  const [about, setAbout] = useState('')
  useEffect(() => { api.bootstrap().then((data) => setAbout(data.settings.about || '')).catch(() => {}) }, [])
  return (
    <div className="container narrow">
      <header className="page-head">
        <p className="kicker">بلو هوم</p>
        <h1>من نحن</h1>
      </header>
      <div className="panel stack-form">
        <p>بلو هوم منصة لعرض وتسويق الوحدات السكنية والمشاريع والأراضي. الصفحات تعرض البيانات التي يدخلها صاحب المنصة: السعر، المساحة، المقدم، الأقساط، والمميزات.</p>
        <p>النطاق الأساسي حاليًا هو 6 أكتوبر، الشيخ زايد، وأكتوبر الجديدة، ويمكن إضافة مناطق أخرى من لوحة التحكم.</p>
        {about ? <p>{about}</p> : null}
      </div>
    </div>
  )
}
