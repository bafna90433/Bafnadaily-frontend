import React from 'react'
import useSettingsStore from '../../store/settingsStore'

interface MOQBadgeProps {
  price: number
  size?: 'sm' | 'md'
}

const MOQBadge: React.FC<MOQBadgeProps> = ({ price, size = 'md' }) => {
  const { settings, getMOQ } = useSettingsStore()
  if (!settings.b2bEnabled) return null

  const moq = getMOQ(price)
  if (moq <= 1) return null

  return (
    <div className={`inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg font-semibold ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1.5'}`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 2L3 7v11h14V7l-7-5zm0 2.236L15 8.18V16H5V8.18L10 4.236z" clipRule="evenodd"/>
      </svg>
      MOQ: {moq} {moq === 1 ? 'pc' : 'pcs'} minimum
    </div>
  )
}

export default MOQBadge
