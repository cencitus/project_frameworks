import React from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'

export default function DefectDetail(){
  const { id } = useParams()
  const [d, setD] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [text, setText] = React.useState('')

  async function load(){
    setLoading(true); setError('')
    try{
      const { data } = await api.get(`/defects/${id}`)
      setD(data)
    }catch(e){
      setError(e?.response?.data?.error || 'Ошибка загрузки')
    }finally{
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [id])

  async function addComment(e){
    e.preventDefault()
    if (!text.trim()) return
    try{
      await api.post(`/defects/${id}/comments`, { text })
      setText('')
      load()
    }catch{
      alert('Не удалось добавить комментарий')
    }
  }

  if (loading) return <div>Загрузка…</div>
  if (error)   return <div style={{color:'crimson'}}>{String(error)}</div>
  if (!d)      return null

  return (
    <div>
      <h2>{d.title}</h2>
      <p><b>Статус:</b> {d.status} &nbsp; <b>Приоритет:</b> {d.priority}</p>
      <p><b>Проект:</b> {d.project?.name || '-'}</p>
      <p><b>Описание:</b><br/>{d.description}</p>

      <h3 style={{marginTop:12}}>Комментарии ({d.comments?.length || 0})</h3>
      <ul>
        {(d.comments || []).map(c => (
          <li key={c.id} style={{marginBottom:6}}>
            <div>{c.text}</div>
            <small>{new Date(c.createdAt).toLocaleString()} — {c.author?.fullName || '—'}</small>
          </li>
        ))}
      </ul>

      <form onSubmit={addComment} style={{display:'flex', gap:8, marginTop:10}}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Новый комментарий" style={{flex:1}} />
        <button>Добавить</button>
      </form>
    </div>
  )
}
