import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Package, Heart, MapPin, LogOut, Edit2, Check } from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'

const ProfilePage: React.FC = () => {
  const { user, logout, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name||'')
  const [email, setEmail] = useState(user?.email||'')

  if (!user) { navigate('/login'); return null }

  const save = async () => {
    try { const res = await api.put('/auth/me',{name,email}); updateUser(res.data.user); setEditing(false); toast.success('Profile updated!') }
    catch { toast.error('Update failed') }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold mb-6">My Account</h1>
      <div className="card p-6 mb-5">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center flex-shrink-0"><span className="text-white font-bold text-2xl">{user.name?.[0]?.toUpperCase()||'U'}</span></div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-2"><input value={name} onChange={e=>setName(e.target.value)} className="input py-2" placeholder="Your name"/><input value={email} onChange={e=>setEmail(e.target.value)} className="input py-2" placeholder="Email (optional)"/></div>
            ) : (
              <><h2 className="text-xl font-bold">{user.name}</h2><p className="text-gray-500">+91 {user.phone}</p>{user.email&&<p className="text-gray-400 text-sm">{user.email}</p>}</>
            )}
          </div>
          <button onClick={editing?save:()=>setEditing(true)} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20">{editing?<Check size={20}/>:<Edit2 size={20}/>}</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[[Package,'My Orders','/orders','text-blue-500 bg-blue-50'],[Heart,'Wishlist','/wishlist','text-red-500 bg-red-50'],[MapPin,'Addresses','#','text-green-500 bg-green-50'],[User,'Settings','#','text-purple-500 bg-purple-50']].map(([Icon,label,to,color]:[any,string,string,string]) => (
          <Link key={label} to={to} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon size={20}/></div>
            <span className="font-semibold text-sm">{label}</span>
          </Link>
        ))}
      </div>
      <button onClick={()=>{logout();navigate('/')}} className="w-full border-2 border-red-200 text-red-500 py-3 rounded-xl font-semibold hover:bg-red-50 flex items-center justify-center gap-2 transition-colors"><LogOut size={18}/> Logout</button>
    </div>
  )
}

export default ProfilePage
