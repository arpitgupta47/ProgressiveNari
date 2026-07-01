import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { useLocation2 } from '../context/LocationContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { t } from '../utils/translations.js'
import api from '../api/api.js'

const CATEGORIES = ['all', 'Pickles', 'Bakery', 'Cloth', 'Paintings', 'Art & Craft', 'Saree', 'Jewellery', 'Food', 'Other']
const RADIUS_OPTIONS = [1, 5, 10, 20, 35]

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { location, locationStatus, requestLocation, clearLocation } = useLocation2()
  const { lang } = useLang()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [locationFiltered, setLocationFiltered] = useState(false)
  const [radius, setRadius] = useState(1) // km
  const [noNearby, setNoNearby] = useState(false)

  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || 'all'

  useEffect(() => {
    loadProducts()
  }, [search, category, page, location, radius])

  const loadProducts = async () => {
    setLoading(true)
    setNoNearby(false)
    try {
      const params = new URLSearchParams({ page, limit: 24 })
      if (search) params.set('search', search)
      if (category && category !== 'all') params.set('category', category)

      // ── LOCATION FILTER (THE FIX) ──────────────────────────
      // Only add location params when user has GRANTED location
      if (locationStatus === 'granted' && location?.lat && location?.lng) {
        params.set('lat', location.lat)
        params.set('lng', location.lng)
        params.set('radius', radius)
      }
      // When location is 'idle' or 'denied' → NO location params → shows ALL products
      // ──────────────────────────────────────────────────────────

      const res = await api.get(`/products?${params}`)
      setProducts(res.data.products || [])
      setTotal(res.data.total || 0)
      setTotalPages(res.data.pages || 1)
      setLocationFiltered(res.data.locationFiltered || false)

      if (locationStatus === 'granted' && (res.data.products || []).length === 0) {
        setNoNearby(true)
      }
    } catch { }
    setLoading(false)
  }

  const handleShowAll = () => {
    clearLocation()
    loadProducts()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-28 pb-12 max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">
              {search ? `"${search}" ${lang === 'hi' ? 'के परिणाम' : 'Results'}` : category !== 'all' ? category : t(lang, 'all_products')}
            </h1>
            <p className="text-sm text-muted">
              {total} {lang === 'hi' ? 'उत्पाद' : 'products'}
              {locationFiltered && location && (
                <span className="ml-2 text-green-600 font-semibold">📍 {location.displayName} ({radius}km)</span>
              )}
            </p>
          </div>

          {/* Location controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {locationStatus !== 'granted' ? (
              <button onClick={requestLocation}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
                📍 {lang === 'hi' ? 'पास के उत्पाद देखें' : 'Show Nearby Products'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {/* Radius selector */}
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm">
                  <span className="text-gray-500 text-xs">{lang === 'hi' ? 'दूरी:' : 'Radius:'}</span>
                  <select value={radius} onChange={e => setRadius(Number(e.target.value))} className="outline-none text-sm font-semibold text-primary bg-transparent">
                    {RADIUS_OPTIONS.map(r => <option key={r} value={r}>{r} km</option>)}
                  </select>
                </div>
                {/* Location pill */}
                <div className="flex items-center gap-1 bg-green-100 text-green-700 rounded-xl px-3 py-1.5 text-sm font-semibold">
                  📍 {location?.displayName}
                </div>
                {/* Clear location */}
                <button onClick={handleShowAll} className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-300 transition-colors">
                  {lang === 'hi' ? 'सभी दिखाएं' : 'Show All'} ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* No nearby sellers message */}
        {noNearby && (
          <div className="card p-6 mb-4 bg-yellow-50 border border-yellow-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-yellow-800">
                {lang === 'hi' ? `${location?.displayName} में ${radius}km के दायरे में कोई विक्रेता नहीं मिला।` : `No sellers found within ${radius}km of ${location?.displayName}.`}
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                {lang === 'hi' ? 'दायरा बढ़ाएं या सभी उत्पाद देखें।' : 'Try increasing the radius or view all products.'}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setRadius(r => Math.min(100, r + 25))} className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-semibold">
                +25km
              </button>
              <button onClick={handleShowAll} className="px-4 py-2 bg-white border border-yellow-300 text-yellow-700 rounded-lg text-sm font-semibold">
                {lang === 'hi' ? 'सभी दिखाएं' : 'Show All'}
              </button>
            </div>
          </div>
        )}

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => { setSearchParams(cat === 'all' ? {} : { category: cat }); setPage(1) }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${(category === cat || (cat === 'all' && category === 'all'))
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'}`}>
              {cat === 'all' ? (lang === 'hi' ? '🛒 सभी' : '🛒 All') : cat}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="card">
                <div className="shimmer h-48 w-full" />
                <div className="p-3 space-y-2">
                  <div className="shimmer h-4 rounded w-3/4" />
                  <div className="shimmer h-4 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 && !noNearby ? (
          <div className="card p-12 text-center">
            <p className="text-5xl">🔍</p>
            <p className="text-gray-500 mt-4 text-lg">{t(lang, 'no_products_found')}</p>
            {search && <p className="text-sm text-muted mt-1">{lang === 'hi' ? 'अलग शब्द से खोजें' : 'Try a different search term'}</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {products.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-200 transition-colors">
              {t(lang, 'prev')}
            </button>
            <span className="px-4 py-2 text-sm">{t(lang, 'page')} {page} {t(lang, 'of')} {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-200 transition-colors">
              {t(lang, 'next')}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
