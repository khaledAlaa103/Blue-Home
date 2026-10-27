import { useEffect, useState } from 'react'
import { api } from '../api'
import { InquiryForm } from '../components/InquiryForm'
import { contactNumbers, telLink, useTitle, waLink } from '../format'

export default function Contact() {
  useTitle('تواصل معنا')
  const [settings, setSettings] = useState(null)
  useEffect(() => { api.bootstrap().then((data) => setSettings(data.settings)).catch(() => {}) }, [])
  const { phone, whatsapp } = contactNumbers(settings)
  return (
    <div className="container">
      <header className="page-head"><h1>تواصل معنا</h1></header>
      <div className="contact-grid">
        <div className="panel">
          <h2>بيانات التواصل</h2>
          {phone || whatsapp ? (
            <div className="cta-row">
              {phone ? <a className="btn btn-primary" href={telLink(phone)}><span>اتصال</span><bdi dir="ltr">{phone}</bdi></a> : null}
              {whatsapp ? <a className="btn btn-wa" href={waLink(whatsapp, 'مرحباً، أود الاستفسار عن عروض بلو هوم.')} target="_blank" rel="noreferrer">واتساب</a> : null}
            </div>
          ) : null}
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
