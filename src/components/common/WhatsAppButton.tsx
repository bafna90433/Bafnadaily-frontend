import React, { useState } from 'react'
import useSettingsStore from '../../store/settingsStore'

const WhatsAppButton: React.FC = () => {
  const { settings } = useSettingsStore()
  const [hovered, setHovered] = useState(false)

  if (!settings.whatsappEnabled || !settings.whatsappNumber) return null

  const msg = encodeURIComponent(`Hi! I need help with my order on ${settings.siteName} 🛍️`)
  const url = `https://wa.me/91${settings.whatsappNumber}?text=${msg}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed bottom-24 right-4 lg:bottom-6 z-50 flex items-center gap-3 group"
      aria-label="Chat on WhatsApp"
    >
      {/* Tooltip */}
      <div className={`bg-gray-800 text-white text-xs font-medium px-3 py-2 rounded-xl whitespace-nowrap shadow-lg transition-all duration-200 ${hovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}`}>
        Chat with us! 💬
      </div>

      {/* Button */}
      <div className="relative w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-xl shadow-green-500/40 hover:scale-110 transition-transform duration-200 active:scale-95">
        {/* Ping animation */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
        {/* WhatsApp SVG icon */}
        <svg viewBox="0 0 32 32" className="w-8 h-8 fill-white relative z-10" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.004 2.667C8.637 2.667 2.667 8.637 2.667 16c0 2.347.634 4.64 1.84 6.653L2.667 29.333l6.893-1.8A13.267 13.267 0 0016.004 29.333C23.37 29.333 29.333 23.363 29.333 16S23.37 2.667 16.004 2.667zm0 24c-2.16 0-4.28-.587-6.12-1.693l-.44-.267-4.08 1.067 1.093-3.973-.28-.453A10.587 10.587 0 015.333 16c0-5.88 4.787-10.667 10.667-10.667S26.667 10.12 26.667 16 21.88 26.667 16.004 26.667zm5.853-7.973c-.32-.16-1.893-.933-2.186-1.04-.294-.107-.507-.16-.72.16s-.827 1.04-1.013 1.253c-.187.214-.374.24-.694.08-.32-.16-1.347-.493-2.56-1.573-.947-.84-1.587-1.88-1.773-2.2-.187-.32-.02-.493.14-.653.147-.147.32-.374.48-.56.16-.187.213-.32.32-.534.107-.214.053-.4-.027-.56-.08-.16-.72-1.733-.987-2.373-.253-.613-.52-.533-.72-.547h-.613c-.214 0-.56.08-.853.4s-1.12 1.093-1.12 2.666.747 2.774.853 2.961c.107.187 1.467 2.24 3.547 3.146.494.213.88.34 1.18.44.496.16.947.137 1.307.08.4-.067 1.227-.5 1.4-.987.173-.48.173-.893.12-.987-.053-.093-.24-.16-.56-.32z"/>
        </svg>
      </div>
    </a>
  )
}

export default WhatsAppButton
