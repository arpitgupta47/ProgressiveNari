import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import ProductCard from '../components/ProductCard.jsx'
import api from '../api/api.js'

const CATEGORIES = ['all', 'Pickles (Achaar)', 'Bakery', 'Cloth', 'Paintings', 'Art & Craft', 'Saree', 'Jewellery', 'Food', 'Other']

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || 'all'

  useEffect(() => {
    loadProducts()
  }, [search, category, page])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 24 })
      if (search) params.set('search', search)
      if (category && category !== 'all') params.set('category', category)
      const res = await api.get(`/products?${params}`)
      setProducts(res.data.products || [])
      setTotal(res.data.total || 0)
      setTotalPages(res.data.pages || 1)
    } catch { } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-28 pb-12 max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">
              {search ? `Results for "${search}"` : category !== 'all' ? category : 'All Products'}
            </h1>
            <p className="text-sm text-muted">{total} products found</p>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSearchParams(cat === 'all' ? {} : { category: cat })}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${(category === cat || (cat === 'all' && !category)) ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'}`}>
              {cat === 'all' ? '🛒 All' : cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="bg-gray-200 h-48" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-5xl">🔍</p>
            <p className="text-gray-500 mt-4 text-lg">No products found</p>
            {search && <p className="text-sm text-muted mt-1">Try a different search term</p>}
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
              className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-200">← Prev</button>
            <span className="px-4 py-2 text-sm">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-200">Next →</button>
          </div>
        )}
      </main>
    </div>
  )
}
