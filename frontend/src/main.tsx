import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Admin } from './Admin'
import { StatusPage } from './StatusPage'
import './styles.css'

const admin = location.pathname.startsWith('/admin')
document.title = admin ? 'Pulse · Admin' : 'Status · Pulse'

createRoot(document.getElementById('root')!).render(<StrictMode>{admin ? <Admin /> : <StatusPage />}</StrictMode>)
