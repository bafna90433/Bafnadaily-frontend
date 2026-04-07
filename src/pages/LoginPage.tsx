import React, { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Phone, Shield, ArrowLeft, CheckCircle } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useSettingsStore from '../store/settingsStore'
import toast from 'react-hot-toast'

const LoginPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [name, setName] = useState('')
  const { sendOTP, verifyOTP, loading } = useAuthStore()
  const { settings } = useSettingsStore()
  const siteName = settings.siteName || 'Reteiler'
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from || '/'
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{10}$/.test(phone)) { toast.error('Enter valid 10-digit number'); return }
    const res = await sendOTP(phone)
    if (res.success) { toast.success('OTP sent! 📱'); setStep(2) }
    else toast.error(res.message || 'Failed to send OTP')
  }

  const handleOTPChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return
    const arr = [...otp]; arr[idx] = val.slice(-1); setOtp(arr)
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus()
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpStr = otp.join('')
    if (otpStr.length !== 6) { toast.error('Enter complete 6-digit OTP'); return }
    const res = await verifyOTP(phone, otpStr, name)
    if (res.success) { toast.success(`Welcome to ${siteName}! 🎉`); navigate(from, { replace: true }) }
    else toast.error(res.message || 'Invalid OTP')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
              <span className="text-white font-bold text-3xl font-heading">{siteName[0].toUpperCase()}</span>
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">{step === 1 ? `Login to ${siteName}` : 'Verify OTP'}</h1>
            <p className="text-gray-500 text-sm mt-1">{step === 1 ? 'Enter your mobile number' : `Code sent to +91 ${phone}`}</p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSend} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Number</label>
                <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-primary transition-colors">
                  <span className="px-4 py-3 bg-gray-50 text-gray-600 font-semibold border-r border-gray-200">+91</span>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                    className="flex-1 px-4 py-3 focus:outline-none text-sm" placeholder="10-digit number" maxLength={10} required autoFocus />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
                <Phone size={18}/> {loading ? 'Sending…' : 'Get OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Your Name <span className="text-gray-400 font-normal">(first time only)</span></label>
                <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Enter your full name" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">6-Digit OTP</label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, idx) => (
                    <input key={idx} ref={el => inputRefs.current[idx] = el}
                      type="text" inputMode="numeric" value={digit} maxLength={1}
                      onChange={e => handleOTPChange(e.target.value, idx)}
                      onKeyDown={e => handleKeyDown(e, idx)}
                      className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-colors ${digit ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 focus:border-primary'}`}
                    />
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
                <CheckCircle size={18}/> {loading ? 'Verifying…' : 'Verify & Login'}
              </button>
              <div className="flex justify-between text-sm">
                <button type="button" onClick={() => { setStep(1); setOtp(['','','','','','']) }} className="text-gray-500 flex items-center gap-1 hover:text-primary">
                  <ArrowLeft size={14}/> Change number
                </button>
                <button type="button" onClick={handleSend} className="text-primary font-bold hover:underline">Resend OTP</button>
              </div>
            </form>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield size={13}/> Your number is 100% secure
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
