import { useEffect, useState } from 'react'
import { api } from '../api'
import { InquiryForm } from '../components/InquiryForm'
import { contactNumbers, telLink, useTitle, waLink } from '../format'

const WA_MESSAGE = 'مرحباً، أود الاستفسار عن عروض بلو هوم.'

function Icon({ name }) {
  const paths = {
    phone: <path d="M6.6 3.5h2.6l1.5 4-2 1.3a11 11 0 0 0 6.5 6.5l1.3-2 4 1.5v2.6a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" />,
    whatsapp: <path d="M4 20l1.2-4A8 8 0 1 1 8 18.8L4 20Zm5-11.5c0 3.6 2.9 6.5 6.5 6.5l1-1.6-2-1-1 .9a4.6 4.6 0 0 1-2.8-2.8l.9-1-1-2L9 8.5Z" />,
    mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4 7 8 6 8-6" /></>,
    pin: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.4" /></>,
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

function Row({ icon, label, href, external, children }) {
  const body = (
    <>
      <span className={`contact-icon ${icon}`}><Icon name={icon} /></span>
      <span className="contact-text"><small>{label}</small><b>{children}</b></span>
    </>
  )
  return (
    <li>
      {href
        ? <a className="contact-row" href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>{body}</a>
        : <div className="contact-row">{body}</div>}
    </li>
  )
}

export default function Contact() {
  useTitle('تواصل معنا')
  const [settings, setSettings] = useState(null)
  useEffect(() => { api.bootstrap().then((data) => setSettings(data.settings)).catch(() => {}) }, [])
  const { phone, whatsapp } = contactNumbers(settings)
  const email = settings?.email
  const address = settings?.address
  const hasDetails = phone || (whatsapp && whatsapp !== phone) || email || address
  return (
    <div className="container">
      <header className="page-head"><h1>تواصل معنا</h1></header>
      <div className="contact-grid">
        <section className="panel contact-card">
          <h2>بيانات التواصل</h2>
          {phone || whatsapp ? (
            <div className="contact-actions">
              {phone ? <a className="btn btn-primary btn-lg" href={telLink(phone)}><Icon name="phone" />اتصل بنا</a> : null}
              {whatsapp ? <a className="btn btn-wa btn-lg" href={waLink(whatsapp, WA_MESSAGE)} target="_blank" rel="noreferrer"><Icon name="whatsapp" />واتساب</a> : null}
            </div>
          ) : null}
          {hasDetails ? (
            <ul className="contact-list">
              {phone ? <Row icon="phone" label="الهاتف" href={telLink(phone)}><bdi dir="ltr">{phone}</bdi></Row> : null}
              {whatsapp && whatsapp !== phone ? <Row icon="whatsapp" label="واتساب" href={waLink(whatsapp, WA_MESSAGE)} external><bdi dir="ltr">{whatsapp}</bdi></Row> : null}
              {email ? <Row icon="mail" label="البريد الإلكتروني" href={`mailto:${email}`}><bdi dir="ltr">{email}</bdi></Row> : null}
              {address ? <Row icon="pin" label="العنوان">{address}</Row> : null}
            </ul>
          ) : null}
        </section>
        <section className="panel contact-card">
          <h2>أرسل رسالة</h2>
          <InquiryForm allowViewing={false} />
        </section>
      </div>
    </div>
  )
}
