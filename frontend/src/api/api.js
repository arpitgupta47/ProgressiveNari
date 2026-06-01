import axios from 'axios'

const rawApiUrl = import.meta.env.VITE_API_URL || ''
const apiBaseURL = rawApiUrl
  ? rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '') + '/api'
  : '/api'

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 15000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pn_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pn_token')
      localStorage.removeItem('pn_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
