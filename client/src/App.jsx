import React from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { getToken, logout } from './auth'

export default function App(){
  const navigate = useNavigate()
  const location = useLocation()
  const token = getToken()

  React.useEffect(() => {
    if (!token && location.pathname !== '/login') navigate('/login')
  }, [token, location.pathname, navigate])

  return (
    <div style={{fontFamily:'system-ui, Segoe UI, Roboto, Arial', maxWidth: 960, margin:'20px auto', padding:'0 12px'}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
        <nav style={{display:'flex', gap:12}}>
          <Link to="/">Дефекты</Link>
        </nav>
        <div>
          {token
            ? <button onClick={() => { logout(); navigate('/login') }}>Выйти</button>
            : <Link to="/login">Войти</Link>}
        </div>
      </header>
      <Outlet />
    </div>
  )
}
