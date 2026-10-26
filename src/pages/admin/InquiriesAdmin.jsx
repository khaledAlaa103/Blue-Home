import { useEffect, useState } from 'react'
import { api } from '../../api'
import { formatDate, requestLabel, useTitle } from '../../format'

export default function InquiriesAdmin() {
  useTitle('الطلبات')
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  function load() { api.inquiries().then((data) => setItems(data.items)).catch((err) => setError(err.message)) }
  useEffect(load, [])
  return (
    <>
      <h1>طلبات العملاء</h1>
      {error ? <p className="msg-err">{error}</p> : null}
      {!items.length ? <p className="empty">لا توجد طلبات بعد.</p> : null}
      <div className="panel table-wrap">
        <table>
          <thead><tr><th>التاريخ</th><th>الاسم</th><th>الموبايل</th><th>الطلب</th><th>الرسالة</th><th></th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={item.read ? '' : 'unread'}>
                <td>{formatDate(item.createdAt)}</td>
                <td>{item.name}</td>
                <td className="num">{item.phone}</td>
                <td>{requestLabel(item.requestType)}{item.listingTitle ? ` · ${item.listingTitle}` : ''}{item.projectName ? ` · ${item.projectName}` : ''}</td>
                <td>{item.message}</td>
                <td className="actions">
                  {!item.read ? <button className="btn btn-line btn-sm" type="button" onClick={async () => { await api.markInquiry(item.id, true); load() }}>تمت القراءة</button> : null}
                  <button className="btn btn-danger btn-sm" type="button" onClick={async () => { if (window.confirm('حذف الطلب؟')) { await api.deleteInquiry(item.id); load() } }}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
