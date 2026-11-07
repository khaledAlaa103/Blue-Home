import { PROPERTY_TYPES, ROOM_TYPES, OPERATIONS, PAYMENTS, STATUSES, SORTS } from '../../shared/constants.js'

import { useLang } from '../i18n'

const MONTHS = [12, 24, 36, 48, 60, 72, 84, 120]

export function Filters({ areas, projects, values, onChange, onSubmit, onReset, onClose, group }) {
  const { t } = useLang()
  const set = (key) => (event) => onChange({ ...values, [key]: event.target.value })
  const types = group === 'lands' ? [] : group === 'units' ? PROPERTY_TYPES.filter((item) => item !== 'أرض') : PROPERTY_TYPES
  const showRooms = group !== 'lands' && group !== 'properties' && (!values.type || ROOM_TYPES.includes(values.type))
  const showPlan = values.payment !== 'cash'
  return (
    <form className={onClose ? 'filters open' : 'filters'} onSubmit={onSubmit}>
      <div className="filters-head">
        <strong>{t('تصفية')}</strong>
        {onClose ? <button className="btn btn-line btn-sm sheet-close" type="button" onClick={onClose}>{t('إغلاق')}</button> : null}
      </div>
      <div className="filters-body">
        <label className="field"><span>{t('المنطقة')}</span>
          <select value={values.areaId || ''} onChange={set('areaId')}>
            <option value="">{t('كل المناطق')}</option>
            {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
          </select>
        </label>
        {group !== 'lands' && group !== 'properties' ? (
          <label className="field"><span>{t('نوع العقار')}</span>
            <select value={values.type || ''} onChange={set('type')}>
              <option value="">الكل</option>
              {types.map((type) => <option key={type} value={type}>{t(type)}</option>)}
            </select>
          </label>
        ) : null}
        {group !== 'properties' ? (
          <label className="field"><span>{t('نوع العملية')}</span>
            <select value={values.operation || ''} onChange={set('operation')}>
              <option value="">الكل</option>
              {OPERATIONS.map((item) => <option key={item.id} value={item.id}>{t(item.label)}</option>)}
            </select>
          </label>
        ) : null}
        {group !== 'properties' ? (
          <label className="field"><span>{t('اسم المشروع أو الكمبوند')}</span>
            <input list="project-names" value={values.project || ''} onChange={set('project')} placeholder={t('اكتب جزءًا من الاسم')} />
            <datalist id="project-names">{projects.map((project) => <option key={project.id} value={project.name} />)}</datalist>
          </label>
        ) : null}
        <label className="field"><span>{t('السعر من')}</span><input className="num" inputMode="decimal" value={values.minPrice || ''} onChange={set('minPrice')} placeholder={t('ج.م')} /></label>
        <label className="field"><span>{t('السعر إلى')}</span><input className="num" inputMode="decimal" value={values.maxPrice || ''} onChange={set('maxPrice')} placeholder={t('ج.م')} /></label>
        <label className="field"><span>{t('المساحة من م²')}</span><input className="num" inputMode="decimal" value={values.minArea || ''} onChange={set('minArea')} /></label>
        <label className="field"><span>{t('المساحة إلى م²')}</span><input className="num" inputMode="decimal" value={values.maxArea || ''} onChange={set('maxArea')} /></label>
        {showRooms ? (
          <>
            <label className="field"><span>{t('الغرف')}</span>
              <select value={values.rooms || ''} onChange={set('rooms')}>
                <option value="">الكل</option>
                {[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count}+</option>)}
              </select>
            </label>
            <label className="field"><span>{t('الحمامات')}</span>
              <select value={values.baths || ''} onChange={set('baths')}>
                <option value="">الكل</option>
                {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}+</option>)}
              </select>
            </label>
          </>
        ) : null}
        <label className="field"><span>{t('نظام السداد')}</span>
          <select value={values.payment || ''} onChange={set('payment')}>
            <option value="">الكل</option>
            {PAYMENTS.filter((item) => item.id !== 'both').map((item) => <option key={item.id} value={item.id}>{t(item.label)}</option>)}
          </select>
        </label>
        {showPlan ? (
          <>
            <label className="field"><span>{t('المقدم من')}</span><input className="num" inputMode="decimal" value={values.minDown || ''} onChange={set('minDown')} /></label>
            <label className="field"><span>{t('المقدم إلى')}</span><input className="num" inputMode="decimal" value={values.maxDown || ''} onChange={set('maxDown')} /></label>
            <label className="field"><span>{t('مدة التقسيط')}</span>
              <select value={values.maxMonths || ''} onChange={set('maxMonths')}>
                <option value="">الكل</option>
                {MONTHS.map((month) => <option key={month} value={month}>{t(`حتى ${month} شهر`)}</option>)}
              </select>
            </label>
          </>
        ) : null}
        <label className="field"><span>{t('الحالة')}</span>
          <select value={values.status || ''} onChange={set('status')}>
            <option value="">الكل</option>
            {STATUSES.map((item) => <option key={item.id} value={item.id}>{t(item.label)}</option>)}
          </select>
        </label>
        <label className="check"><input type="checkbox" checked={values.offers === '1'} onChange={(event) => onChange({ ...values, offers: event.target.checked ? '1' : '' })} /> {t('عروض وتقسيط وفرص استثمار')}</label>
        <label className="field"><span>{t('الترتيب')}</span>
          <select value={values.sort || 'newest'} onChange={set('sort')}>
            {SORTS.map((item) => <option key={item.id} value={item.id}>{t(item.label)}</option>)}
          </select>
        </label>
      </div>
      <div className="filters-foot">
        <button className="btn btn-primary" type="submit">{t('عرض النتائج')}</button>
        <button className="btn btn-line" type="button" onClick={onReset}>{t('مسح')}</button>
      </div>
    </form>
  )
}

export const FILTER_KEYS = ['areaId', 'type', 'operation', 'project', 'minPrice', 'maxPrice', 'minArea', 'maxArea', 'rooms', 'baths', 'payment', 'minDown', 'maxDown', 'maxMonths', 'status', 'offers', 'sort']
