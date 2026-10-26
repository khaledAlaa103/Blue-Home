import { useEffect, useState } from 'react'
import { api } from '../api'
import { InquiryForm } from '../components/InquiryForm'
import { telLink, useTitle, waLink } from '../format'

export default function Contact() {
  useTitle('تواصل معنا')
  const [settings, setSettings] = useState(null)
  useEffect(() => { api.bootstrap().then((data) => setSettings(data.settings)).catch(() => {}) }, [])
  return (
    <div className="container">
      <header className="page-head"><h1>تواصل معنا</h1></header>
      <div className="contact-grid">
        <div className="panel">
          <h2>بيانات التواصل</h2>
          {settings?.phone ? <p><a href={telLink(settings.phone)}>{settings.phone}</a></p> : <p className="quiet">رقم الهاتف غير مضاف بعد.</p>}
          {settings?.whatsapp ? <p><a className="btn btn-wa" href={waLink(settings.whatsapp, 'مرحباً، أود الاستفسار عن عروض بلو هوم.')} target="_blank" rel="noreferrer">واتساب</a></p> : null}
          {settings?.email ? <p><a href={`mailto:${settings.email}`}>{settings.email}</a></p> : null}
          {settings?.address ? <p>{settings.address}</p> : null}
        </div>
        <div className="panel">
          <h2>أرسل رسالة</h2>
          <InquiryForm allowViewing={false} />
        </div>
      </div>
    </div>
  )
}
