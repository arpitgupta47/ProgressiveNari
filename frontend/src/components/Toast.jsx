import { useState, useEffect } from 'react'

let toastCallback = null

export const showToast = (message, type = 'success') => {
  if (toastCallback) toastCallback({ message, type, id: Date.now() })
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    toastCallback = (toast) => {
      setToasts(prev => [...prev, toast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, 3500)
    }
    return () => { toastCallback = null }
  }, [])

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  }
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-yellow-500'
  }

  return (
    <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className={`${colors[toast.type]} text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-64 max-w-sm toast-enter`}>
          <span>{icons[toast.type]}</span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
