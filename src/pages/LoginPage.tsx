import React, { useState, useRef } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useNavigate, useLocation } from 'react-router-dom'
import { Phone, Shield, ArrowLeft, CheckCircle, Upload, Trash2, Loader2 } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useSettingsStore from '../store/settingsStore'
import toast from 'react-hot-toast'

const LoginPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [visitingCard, setVisitingCard] = useState('')
  const [upLoading, setUpLoading] = useState(false)
  const { sendOTP, verifyOTP, loginWithGoogle, loading } = useAuthStore()
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
    const res = await verifyOTP(phone, otpStr, { name, businessName, gstNumber, whatsapp, visitingCard })
    if (res.success) { toast.success(`Welcome to ${siteName}! 🎉`); navigate(from, { replace: true }) }
    else toast.error(res.message || 'Invalid OTP')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUpLoading(true)
    const fd = new FormData()
    fd.append('image', file)
    try {
      const res = await api.post('/upload/visiting-card', fd)
      setVisitingCard(res.data.url)
      toast.success('Visiting card uploaded! 📸')
    } catch { toast.error('Upload failed') } finally { setUpLoading(false) }
  }

  const handleGoogleSuccess = async (response: any) => {
    const res = await loginWithGoogle(response.credential)
    if (res.success) {
      toast.success(`Welcome to ${siteName}! 🎉`)
      navigate(from, { replace: true })
    } else {
      toast.error(res.message || 'Google login failed')
    }
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

              <div className="relative my-8 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <span className="relative px-4 bg-white text-gray-400 text-[10px] font-black uppercase tracking-widest">Or login with</span>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google Login Failed')}
                  useOneTap
                  theme="outline"
                  shape="circle"
                  width="100%"
                />
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Full Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} className="input py-3" placeholder="Enter your full name" required />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Shop / Business Name</label>
                <input value={businessName} onChange={e => setBusinessName(e.target.value)} className="input py-3" placeholder="Apni dukan ka naam" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">GST (Optional)</label>
                  <input value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())} className="input py-3 uppercase" placeholder="GSTIN" maxLength={15} />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">WhatsApp</label>
                  <input value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/\D/g,''))} className="input py-3" placeholder="WhatsApp No." maxLength={10} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Visiting Card (Optional)</label>
                <div className="flex items-center gap-3">
                  <label className={`flex-1 border-2 border-dashed border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all min-h-[80px] bg-gray-50/50 ${upLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {visitingCard ? (
                      <img src={visitingCard} className="h-16 w-full object-contain rounded-lg" alt="VC" />
                    ) : (
                      <>
                        {upLoading ? <Loader2 size={20} className="text-primary animate-spin mb-1"/> : <Upload size={20} className="text-gray-400 mb-1" />}
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{upLoading ? 'Uploading…' : 'Upload Card Image'}</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={upLoading} />
                  </label>
                  {visitingCard && (
                    <button type="button" onClick={() => setVisitingCard('')} className="p-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors">
                      <Trash2 size={18}/>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 text-center">6-Digit OTP</label>
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
