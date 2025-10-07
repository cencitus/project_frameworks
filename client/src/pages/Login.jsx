import React from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../auth'

export default function Login(){
  const [email, setEmail] = React.useState('me@example.com')
  const [password, setPassword] = React.useState('secret123')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const navigate = useNavigate()

  async function onSubmit(e){
    e.preventDefault()
    setError('')
    setLoading(true)
    try{
      await login(email, password)
      navigate('/')
    }catch(err){
      setError(err?.response?.data?.error || 'Ошибка авторизации')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div style={{maxWidth: 380, margin:'60px auto'}}>
      <h2>Вход</h2>
      <form onSubmit={onSubmit} style={{display:'grid', gap:10}}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Пароль" />
        {error && <div style={{color:'crimson'}}>{String(error)}</div>}
        <button disabled={loading}>{loading ? 'Входим…' : 'Войти'}</button>
      </form>
    </div>
  )
}
