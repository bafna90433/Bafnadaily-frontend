import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Package, Heart, MapPin, LogOut, Edit2, Check, MessageCircle, ShieldCheck, FileText, Upload, Trash2, Loader2, Store } from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'

const ProfilePage: React.FC = () => {
  const { user, logout, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name||'')
  const [email, setEmail] = useState(user?.email||'')
  const [businessName, setBusinessName] = useState(user?.businessName||'')
  const [gstNumber, setGstNumber] = useState(user?.gstNumber||'')
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp||'')
  const [visitingCard, setVisitingCard] = useState(user?.visitingCard||'')
  const [upLoading, setUpLoading] = useState(false)

  if (!user) { navigate('/login'); return null }

  const save = async () => {
    try { 
      const res = await api.put('/auth/me',{ name, email, businessName, gstNumber, whatsapp, visitingCard }); 
      updateUser(res.data.user); 
      setEditing(false); 
      toast.success('Profile updated! ✨') 
    }
    catch { toast.error('Update failed') }
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
      toast.success('Visiting card updated! 📸')
    } catch { toast.error('Upload failed') } finally { setUpLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Account</h1>
        <button onClick={editing ? save : () => setEditing(true)} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all active:scale-95 shadow-sm ${editing ? 'bg-green-500 text-white shadow-green-200' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
          {editing ? <><Check size={18}/> Save Changes</> : <><Edit2 size={18}/> Edit Profile</>}
        </button>
      </div>

      {/* Profile Header */}
      <div className="card p-6 mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"/>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary rounded-[28px] flex items-center justify-center flex-shrink-0 shadow-xl shadow-primary/20 ring-4 ring-white">
            <span className="text-white font-black text-3xl">{user.name?.[0]?.toUpperCase()||'U'}</span>
          </div>
          <div className="flex-1 space-y-1">
            {editing ? (
              <div className="space-y-3">
                <input value={name} onChange={e=>setName(e.target.value)} className="input py-2.5 font-bold" placeholder="Your Full Name"/>
                <input value={email} onChange={e=>setEmail(e.target.value)} className="input py-2.5" placeholder="Email Address"/>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black text-gray-900">{user.name}</h2>
                <div className="flex items-center gap-3">
                  <p className="text-gray-500 font-bold">+91 {user.phone}</p>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"/>
                  <p className="text-primary text-xs font-black uppercase tracking-widest">{user.customerType || 'Retailer'}</p>
                </div>
                {user.email && <p className="text-gray-400 text-sm font-medium">{user.email}</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Business Details (If Editing or Exists) */}
      {(editing || user.businessName || user.gstNumber || user.whatsapp) && (
        <div className="mb-8 space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Business Details</h3>
          <div className="card p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Shop Name</label>
                {editing ? <input value={businessName} onChange={e=>setBusinessName(e.target.value)} className="input" placeholder="Shop Name"/> : <p className="font-bold text-gray-800">{user.businessName || '—'}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">GST Number</label>
                {editing ? <input value={gstNumber} onChange={e=>setGstNumber(e.target.value.toUpperCase())} className="input uppercase" placeholder="GSTIN (Optional)" maxLength={15}/> : <p className="font-bold text-primary">{user.gstNumber || '—'}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">WhatsApp Number</label>
                {editing ? <input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} className="input" placeholder="WhatsApp No."/> : <p className="font-bold text-gray-800">{user.whatsapp || '—'}</p>}
              </div>
              {editing && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Visiting Card</label>
                  <label className={`flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary transition-all ${upLoading?'opacity-50 pointer-events-none':''}`}>
                    {upLoading ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16}/>}
                    <span className="text-xs font-bold">{visitingCard ? 'Change Image' : 'Upload Card'}</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden"/>
                  </label>
                </div>
              )}
            </div>
            {visitingCard && (
              <div className="pt-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">My Visiting Card</label>
                <div className="relative group max-w-xs">
                  <img src={visitingCard} className="w-full rounded-2xl shadow-md border border-gray-100" alt="Visiting Card" />
                  {editing && <button onClick={() => setVisitingCard('')} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform"><Trash2 size={14}/></button>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid Actions */}
      <div className="mb-8 space-y-4">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Quick Links</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Package, label: 'My Orders', to: '/orders', color: 'text-blue-500 bg-blue-50' },
            { icon: Heart, label: 'Wishlist', to: '/wishlist', color: 'text-red-500 bg-red-50' },
            { icon: MapPin, label: 'Addresses', to: '/addresses', color: 'text-green-500 bg-green-50' },
            { icon: Store, label: 'Shopping', to: '/', color: 'text-orange-500 bg-orange-50' },
          ].map((item) => (
            <Link key={item.label} to={item.to} className="card p-5 flex items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${item.color}`}><item.icon size={24}/></div>
              <span className="font-bold text-gray-800">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Support & Legal */}
      <div className="mb-10 space-y-4">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Support & Privacy</h3>
        <div className="card divide-y divide-gray-50 overflow-hidden">
          <a href={`https://wa.me/917550350036`} target="_blank" className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center"><MessageCircle size={20}/></div>
              <div><p className="font-bold text-gray-800">Help & Support</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Chat on WhatsApp</p></div>
            </div>
            <Check size={16} className="text-gray-300"/>
          </a>
          <Link to="#" className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center"><ShieldCheck size={20}/></div>
              <div><p className="font-bold text-gray-800">Privacy Policy</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">How we use your data</p></div>
            </div>
            <Check size={16} className="text-gray-300"/>
          </Link>
          <Link to="#" className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center"><FileText size={20}/></div>
              <div><p className="font-bold text-gray-800">Terms of Service</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Our store rules</p></div>
            </div>
            <Check size={16} className="text-gray-300"/>
          </Link>
        </div>
      </div>

      <button onClick={() => { logout(); navigate('/') }} className="w-full bg-red-50 text-red-500 py-4 rounded-[24px] font-black uppercase tracking-widest hover:bg-red-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-sm mb-12">
        <LogOut size={20}/> Logout from Account
      </button>
    </div>
  )
}

export default ProfilePage
