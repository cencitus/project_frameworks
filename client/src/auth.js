import api from './api'

const KEY = 'defects_token'
const USER = 'defects_user'

export const getToken = () => localStorage.getItem(KEY)
export const logout = () => { localStorage.removeItem(KEY); localStorage.removeItem(USER) }
export const setToken = (t) => localStorage.setItem(KEY, t)
export const setUser  = (u) => localStorage.setItem(USER, JSON.stringify(u))

export async function login(email, password){
  const { data } = await api.post('/auth/login', { email, password })
  setToken(data.token)
  setUser(data.user)
  return data.user
}
