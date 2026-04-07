import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../utils/api'

const getSessionId = (): string => {
  let sid = sessionStorage.getItem('_vsid')
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    sessionStorage.setItem('_vsid', sid)
  }
  return sid
}

export const useVisitorTracking = () => {
  const location = useLocation()

  useEffect(() => {
    const track = async () => {
      try {
        await api.post('/analytics/track', {
          page: location.pathname,
          referrer: document.referrer || '',
          sessionId: getSessionId(),
        })
      } catch {}
    }

    // Small delay so it doesn't block rendering
    const t = setTimeout(track, 500)
    return () => clearTimeout(t)
  }, [location.pathname])
}
