import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Login from './pages/Login'
import Defects from './pages/Defects'
import DefectDetail from './pages/DefectDetail'

const router = createBrowserRouter([
  { path: '/', element: <App />,
    children: [
      { index: true, element: <Defects /> },
      { path: 'defects/:id', element: <DefectDetail /> },
      { path: 'login', element: <Login /> },
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
