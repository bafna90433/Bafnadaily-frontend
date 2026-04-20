/// <reference types="vite/client" />
import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
<<<<<<< HEAD
  baseURL: import.meta.env.VITE_API_URL || 'https://api.bafnatoys.com/api',
  timeout: 15000,
=======
  baseURL: import.meta.env.VITE_API_URL || 'https://api.bafnadaily.com/api',
  timeout: 30000,
>>>>>>> 6a5d903 (Updated frontend pages and API integration)
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
