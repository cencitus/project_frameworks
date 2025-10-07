import React from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'

const STATUS_OPTIONS = [
  'NEW', 'IN_PROGRESS', 'IN_REVIEW', 'CLOSED', 'CANCELLED'
]

export default function DefectDetail(){
  const { id } = useParams()

  const [d, setD] = React.useState(null)
  const [users, setUsers] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  // поля редактирования
  const [status, setStatus] = React.useState('')
  const [assigneeId, setAssigneeId] = React.useState('')
  const [dueDate, setDueDate] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const [text, setText] = React.useState('') // новый комментарий

  async function load(){
    setLoading(true); setError('')
    try{
      const [{ data: def }, { data: usersList }] = await Promise.all([
        api.get(`/defects/${id}`),
        api.get('/users')
      ])
      setD(def)
      setUsers(usersList)

      // предзаполняем поля редактирования текущими значениями
      setStatus(def.status || 'NEW')
      setAssigneeId(def.assignee?.id || '')
      setDueDate(def.dueDate ? def.dueDate.slice(0,10) : '')
    }catch(e){
      setError(e?.response?.data?.error || 'Ошибка загрузки')
    }finally{
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [id])

  async function saveChanges(e){
    e.preventDefault()
    setSaving(true)
    try{
      const payload = { status }
      payload.assigneeId = assigneeId || null
      payload.dueDate = dueDate || null
      await api.patch(`/defects/${id}`, payload)
      await load() // перезагрузим карточку
    }catch(e){
      alert(e?.response?.data?.error || 'Не удалось сохранить изменения')
    }finally{
      setSaving(false)
    }
  }

  async function addComment(e){
    e.preventDefault()
    if (!text.trim()) return
    try{
      await api.post(`/defects/${id}/comments`, { text })
      setText('')
      await load()
    }catch{
      alert('Не удалось добавить комментарий')
    }
  }

  if (loading) return <div>Загрузка…</div>
  if (error)   return <div style={{color:'crimson'}}>{String(error)}</div>
  if (!d)      return null

  return (
    <div>
      <h2 style={{marginBottom:6}}>{d.title}</h2>
      <p style={{color:'#555', marginTop:0}}><b>Проект:</b> {d.project?.name || '-'}</p>
      <p><b>Описание:</b><br/>{d.description}</p>

      <h3 style={{marginTop:16}}>Редактирование</h3>
      <form onSubmit={saveChanges} style={{display:'grid', gap:10, maxWidth:520}}>
        <label>
          <div style={{marginBottom:4}}>Статус</div>
          <select value={status} onChange={e=>setStatus(e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label>
          <div style={{marginBottom:4}}>Исполнитель</div>
          <select value={assigneeId} onChange={e=>setAssigneeId(e.target.value)}>
            <option value="">— не назначен —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.fullName || u.email}</option>)}
          </select>
        </label>

        <label>
          <div style={{marginBottom:4}}>Дедлайн</div>
          <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} />
        </label>

        <div style={{display:'flex', gap:8}}>
          <button disabled={saving}>{saving ? 'Сохраняем…' : 'Сохранить'}</button>
          <span style={{alignSelf:'center', color:'#666'}}>
            Текущий: {d.status} {d.assignee?.fullName ? `• ${d.assignee.fullName}` : ''} {d.dueDate ? `• до ${new Date(d.dueDate).toLocaleDateString()}` : ''}
          </span>
        </div>
      </form>

      <h3 style={{marginTop:20}}>Комментарии ({d.comments?.length || 0})</h3>
      <ul>
        {(d.comments || []).map(c => (
          <li key={c.id} style={{marginBottom:6}}>
            <div>{c.text}</div>
            <small>{new Date(c.createdAt).toLocaleString()} — {c.author?.fullName || '—'}</small>
          </li>
        ))}
      </ul>

      <form onSubmit={addComment} style={{display:'flex', gap:8, marginTop:10, maxWidth:520}}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Новый комментарий" style={{flex:1}} />
        <button>Добавить</button>
      </form>
    </div>
  )
}
