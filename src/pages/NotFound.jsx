import { Link } from 'react-router-dom'
import { useTitle } from '../format'

export default function NotFound() {
  useTitle('الصفحة غير موجودة')
  return (
    <div className="container page-head">
      <h1>الصفحة غير موجودة</h1>
      <p className="quiet">الرابط لا يطابق مشروعًا أو إعلانًا منشورًا.</p>
      <Link className="btn btn-primary" to="/">العودة للرئيسية</Link>
    </div>
  )
}
