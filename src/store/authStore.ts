import { create } from 'zustand'
import api from '../utils/api'
import { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  sendOTP: (phone: string) => Promise<{ success: boolean; message?: string }>
  verifyOTP: (phone: string, otp: string, name?: string) => Promise<{ success: boolean; isNew?: boolean; message?: string }>
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  updateUser: (user: User) => void
  fetchMe: () => Promise<void>
}

const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  loading: false,

  sendOTP: async (phone) => {
    set({ loading: true })
    try {
      await api.post('/auth/send-otp', { phone })
      set({ loading: false })
      return { success: true }
    } catch (err: any) {
      set({ loading: false })
      return { success: false, message: err.response?.data?.message || 'Failed to send OTP' }
    }
  },

  verifyOTP: async (phone, otp, name) => {
    set({ loading: true })
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp, name })
      const { token, user, isNew } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      set({ token, user, loading: false })
      return { success: true, isNew }
    } catch (err: any) {
      set({ loading: false })
      return { success: false, message: err.response?.data?.message || 'Invalid OTP' }
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ loading: true })
    try {
      const res = await api.post('/auth/google', { idToken })
      const { token, user } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      set({ token, user, loading: false })
      return { success: true }
    } catch (err: any) {
      set({ loading: false })
      return { success: false, message: err.response?.data?.message || 'Google Login failed' }
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },

  updateUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me')
      const user = res.data.user
      localStorage.setItem('user', JSON.stringify(user))
      set({ user })
    } catch {}
  },
}))

export default useAuthStore
