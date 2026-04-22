import React, { useState } from 'react'
import { MapPin, Plus, Trash2, CheckCircle, Home, Briefcase, Map, ArrowLeft, Loader2, Navigation } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'

const AddressesPage: React.FC = () => {
  const { user, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    shopName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  })

  if (!user) return null

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported')
    setLoading(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
        const data = await res.json()
        const addr = data.address
        
        // Smarter parsing for Indian addresses
        const line1 = [addr.road, addr.house_number, addr.building].filter(Boolean).join(', ') || data.display_name.split(',')[0]
        const line2 = [addr.suburb, addr.neighbourhood, addr.subdistrict, addr.residential].filter(Boolean).slice(0, 2).join(', ')
        const city = addr.city || addr.town || addr.village || addr.district || addr.county || ''
        const state = addr.state || ''
        const pincode = addr.postcode || ''
        
        setForm(prev => ({
          ...prev,
          addressLine1: line1,
          addressLine2: line2,
          city: city,
          state: state,
          pincode: pincode.replace(/\s/g, '')
        }))
        toast.success('Location detected! 📍')
      } catch { toast.error('Failed to detect address') }
      finally { setLoading(false) }
    }, () => {
      toast.error('Location access denied')
      setLoading(false)
    }, { enableHighAccuracy: true })
  }

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/address', form)
      updateUser({ ...user, addresses: res.data.addresses })
      setShowAdd(false)
      setForm({ name: '', phone: '', whatsapp: '', shopName: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', isDefault: false })
      toast.success('Address added! 📍')
    } catch { toast.error('Failed to add address') }
    finally { setLoading(false) }
  }

  const deleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return
    try {
      const res = await api.delete(`/auth/address/${id}`)
      updateUser({ ...user, addresses: res.data.addresses })
      toast.success('Address removed')
    } catch { toast.error('Failed to remove') }
  }

  const setAsDefault = async (id: string) => {
    try {
      const addr = user.addresses.find((a: any) => a._id === id)
      const res = await api.put(`/auth/address/${id}`, { ...addr, isDefault: true })
      updateUser({ ...user, addresses: res.data.addresses })
      toast.success('Default address updated')
    } catch { toast.error('Update failed') }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/profile')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ArrowLeft size={20}/></button>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Saved Addresses</h1>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all active:scale-95 shadow-sm ${showAdd ? 'bg-gray-100 text-gray-500' : 'bg-primary text-white shadow-primary/20'}`}
        >
          {showAdd ? 'Cancel' : <><Plus size={18}/> Add New</>}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addAddress} className="card p-6 mb-8 space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={18} className="text-primary"/> New Address Details</h3>
            <button 
              type="button" 
              onClick={detectLocation} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
            >
              <Navigation size={12}/> Detect My Location
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Contact Name *</label><input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="input" placeholder="e.g. John Doe"/></div>
            <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Phone Number *</label><input required value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="input" placeholder="10-digit mobile"/></div>
          </div>
          <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Shop / Business Name</label><input value={form.shopName} onChange={e=>setForm({...form, shopName: e.target.value})} className="input" placeholder="Dukan ka naam (if any)"/></div>
          <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Address Line 1 *</label><input required value={form.addressLine1} onChange={e=>setForm({...form, addressLine1: e.target.value})} className="input" placeholder="House/Flat No, Building Name"/></div>
          <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Landmark / Area</label><input value={form.addressLine2} onChange={e=>setForm({...form, addressLine2: e.target.value})} className="input" placeholder="Nearby famous place"/></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">City *</label><input required value={form.city} onChange={e=>setForm({...form, city: e.target.value})} className="input" placeholder="City"/></div>
            <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">State *</label><input required value={form.state} onChange={e=>setForm({...form, state: e.target.value})} className="input" placeholder="State"/></div>
            <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Pincode *</label><input required value={form.pincode} onChange={e=>setForm({...form, pincode: e.target.value})} className="input" placeholder="6-digit"/></div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer py-2">
            <input type="checkbox" checked={form.isDefault} onChange={e=>setForm({...form, isDefault: e.target.checked})} className="w-5 h-5 rounded-lg border-gray-300 text-primary focus:ring-primary"/>
            <span className="text-sm font-bold text-gray-600">Set as Default Address</span>
          </label>
          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 size={20} className="animate-spin"/> : 'Save Address'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {user.addresses?.length > 0 ? (
          user.addresses.map((a: any) => (
            <div key={a._id} className={`card p-6 border-2 transition-all ${a.isDefault ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-transparent hover:border-gray-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.isDefault ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {a.shopName ? <Briefcase size={20}/> : <Home size={20}/>}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 flex items-center gap-2">
                      {a.shopName || a.name}
                      {a.isDefault && <span className="bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Default</span>}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{a.name} • {a.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!a.isDefault && (
                    <button onClick={() => setAsDefault(a._id)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors text-xs font-bold">Set Default</button>
                  )}
                  <button onClick={() => deleteAddress(a._id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                </div>
              </div>
              <div className="bg-white/50 p-4 rounded-2xl border border-white/50">
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  {a.addressLine1}{a.addressLine2 && `, ${a.addressLine2}`}<br/>
                  <span className="text-gray-900 font-bold">{a.city}, {a.state} - {a.pincode}</span>
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[40px] border-4 border-dashed border-gray-100">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300 shadow-sm"><Map size={32}/></div>
            <p className="text-gray-400 font-bold">No saved addresses found</p>
            <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-1">Add your shop or home address</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AddressesPage
