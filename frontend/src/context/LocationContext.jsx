import { createContext, useContext, useState, useEffect } from 'react'

const LocationContext = createContext(null)

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null) // { lat, lng, city, state, district }
  const [locationStatus, setLocationStatus] = useState('idle') // idle | requesting | granted | denied
  const [locationError, setLocationError] = useState(null)

  // Try to restore saved location
  useEffect(() => {
    const saved = localStorage.getItem('pn_location')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setLocation(parsed)
        setLocationStatus('granted')
      } catch {}
    }
  }, [])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported')
      setLocationStatus('denied')
      return
    }

    setLocationStatus('requesting')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          // Reverse geocode using free API
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          const data = await res.json()
          const addr = data.address || {}
          const locationData = {
            lat,
            lng,
            city: addr.city || addr.town || addr.village || addr.county || 'Unknown',
            state: addr.state || '',
            district: addr.county || addr.city_district || addr.suburb || '',
            displayName: addr.city || addr.town || addr.village || addr.county || `${lat.toFixed(2)}, ${lng.toFixed(2)}`
          }
          setLocation(locationData)
          setLocationStatus('granted')
          localStorage.setItem('pn_location', JSON.stringify(locationData))
        } catch {
          // Fallback if reverse geocoding fails
          const locationData = { lat, lng, city: 'Your Area', state: '', district: '', displayName: 'Your Area' }
          setLocation(locationData)
          setLocationStatus('granted')
          localStorage.setItem('pn_location', JSON.stringify(locationData))
        }
      },
      (err) => {
        setLocationError(err.message)
        setLocationStatus('denied')
      },
      { timeout: 10000, maximumAge: 300000 }
    )
  }

  const clearLocation = () => {
    setLocation(null)
    setLocationStatus('idle')
    localStorage.removeItem('pn_location')
  }

  return (
    <LocationContext.Provider value={{ location, locationStatus, locationError, requestLocation, clearLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export const useLocation2 = () => useContext(LocationContext)
