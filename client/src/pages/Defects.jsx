import React from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function Defects(){
  const [items, setItems] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [filters, setFilters] = React.useState({ status:'', q:'' })

  async function load(){
    setLoading(true); setError('')
    try{
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.q) params.q = filters.q
      const { data } = await api.get('/defects', { params })
      setItems(data)
    }catch(e){
      setError(e?.response?.data?.error || 'Ошибка загрузки')
    }finally{
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, []) // первый рендер

  return (
    <div>
      <h2>Дефекты</h2>

      <div style={{display:'flex', gap:8, margin:'12px 0'}}>
        <select value={filters.status} onChange={e=>setFilters(f=>({...f, status:e.target.value}))}>
          <option value="">Все статусы</option>
          <option value="NEW">Новая</option>
          <option value="IN_PROGRESS">В работе</option>
          <option value="IN_REVIEW">На проверке</option>
          <option value="CLOSED">Закрыта</option>
          <option value="CANCELLED">Отменена</option>
        </select>
        <input placeholder="Поиск" value={filters.q} onChange={e=>setFilters(f=>({...f, q:e.target.value}))} />
        <button onClick={load}>Применить</button>
      </div>

      {loading && <div>Загрузка…</div>}
      {error && <div style={{color:'crimson'}}>{String(error)}</div>}

      {!loading && !error && (
        <table border="1" cellPadding="6" style={{borderCollapse:'collapse', width:'100%'}}>
          <thead>
            <tr>
              <th>Заголовок</th>
              <th>Проект</th>
              <th>Статус</th>
              <th>Приоритет</th>
            </tr>
          </thead>
          <tbody>
            {items.map(d => (
              <tr key={d.id}>
                <td><Link to={`/defects/${d.id}`}>{d.title}</Link></td>
                <td>{d.project?.name || '-'}</td>
                <td>{d.status}</td>
                <td>{d.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
