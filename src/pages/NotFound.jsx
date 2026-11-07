import { Link } from 'react-router-dom'
import { useTitle } from '../format'
import { useLang } from '../i18n'

export default function NotFound() {
  useTitle('الصفحة غير موجودة')
  const { t } = useLang()
  return (
    <div className="container page-head">
      <h1>{t('الصفحة غير موجودة')}</h1>
      <p className="quiet">{t('الرابط لا يطابق عقارًا أو إعلانًا منشورًا.')}</p>
      <Link className="btn btn-primary" to="/">{t('العودة للرئيسية')}</Link>
    </div>
  )
}
