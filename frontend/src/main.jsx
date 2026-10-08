import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App'
import { LangProvider } from './i18n'
import { AuthProvider } from './AuthContext'
ReactDOM.createRoot(document.getElementById('root')).render(<BrowserRouter><LangProvider><AuthProvider><App /></AuthProvider></LangProvider></BrowserRouter>)
