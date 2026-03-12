// Entry point for the React application.
// Mounts the root <App> component into the #root div defined in index.html.
// StrictMode enables additional runtime warnings in development to help catch
// potential issues (e.g. deprecated APIs, unexpected side effects).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
