import { createContext, useContext, useState, useEffect } from 'react'

const LocationContext = createContext(null)

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle') // idle | requesting | granted | denied
  const [locationError, setLocationError] = useState(null)

  // Restore saved location on mount
  useEffect(() => {
    const saved = localStorage.getItem('pn_location')
    if (saved) {
      try {
        setLocation(JSON.parse(saved))
        setLocationStatus('granted')
      } catch {}
    }
  }, [])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser')
      setLocationStatus('denied')
      return
    }
    setLocationStatus('requesting')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          // Free reverse geocoding via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const addr = data.address || {}

          const locationData = {
            lat,
            lng,
            city: addr.city || addr.town || addr.village || addr.county || '',
            district: addr.county || addr.city_district || addr.suburb || '',
            state: addr.state || '',
            pincode: addr.postcode || '',
            displayName: addr.city || addr.town || addr.village || addr.county || `${lat.toFixed(3)},${lng.toFixed(3)}`
          }

          setLocation(locationData)
          setLocationStatus('granted')
          localStorage.setItem('pn_location', JSON.stringify(locationData))
        } catch {
          // Fallback — use coordinates without city name
          const locationData = { lat, lng, city: '', district: '', state: '', pincode: '', displayName: 'Your Location' }
          setLocation(locationData)
          setLocationStatus('granted')
          localStorage.setItem('pn_location', JSON.stringify(locationData))
        }
      },
      (err) => {
        setLocationError(err.message)
        setLocationStatus('denied')
      },
      { timeout: 10000, maximumAge: 300000, enableHighAccuracy: true }
    )
  }

  const clearLocation = () => {
    setLocation(null)
    setLocationStatus('idle')
    setLocationError(null)
    localStorage.removeItem('pn_location')
  }

  return (
    <LocationContext.Provider value={{ location, locationStatus, locationError, requestLocation, clearLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export const useLocation2 = () => useContext(LocationContext)
