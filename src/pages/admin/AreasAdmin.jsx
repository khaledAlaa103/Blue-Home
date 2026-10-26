import { useEffect, useState } from 'react'
import { api } from '../../api'
import { useTitle } from '../../format'
import { Field } from './ui'

export default function AreasAdmin() {
  useTitle('المناطق')
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [edit, setEdit] = useState(null)
  const [error, setError] = useState('')

  function load() { api.adminAreas().then((data) => setItems(data.items)).catch((err) => setError(err.message)) }
  useEffect(load, [])

  async function save(event) {
    event.preventDefault()
    try {
      await api.saveArea({ name }, edit?.id)
      setName('')
      setEdit(null)
      setError('')
      load()
    } catch (err) { setError(err.message) }
  }

  return (
    <>
      <h1>المناطق</h1>
      <form className="panel form-grid" onSubmit={save}>
        <Field label="اسم المنطقة"><input value={name} onChange={(event) => setName(event.target.value)} required /></Field>
        <div className="actions">
          <button className="btn btn-primary" type="submit">{edit ? 'حفظ التعديل' : 'إضافة منطقة'}</button>
          {edit ? <button className="btn btn-line" type="button" onClick={() => { setEdit(null); setName('') }}>إلغاء</button> : null}
        </div>
      </form>
      {error ? <p className="msg-err">{error}</p> : null}
      <div className="panel table-wrap">
        <table>
          <thead><tr><th>المنطقة</th><th></th></tr></thead>
          <tbody>
            {items.map((area) => (
              <tr key={area.id}>
                <td>{area.name}</td>
                <td className="actions">
                  <button className="btn btn-line btn-sm" type="button" onClick={() => { setEdit(area); setName(area.name) }}>تعديل</button>
                  <button className="btn btn-danger btn-sm" type="button" onClick={async () => { if (window.confirm(`حذف ${area.name}؟`)) { try { await api.deleteArea(area.id); load() } catch (err) { setError(err.message) } } }}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
