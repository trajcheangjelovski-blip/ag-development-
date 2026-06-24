'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { CATALOG, getCatalogItem } from '@/lib/catalog'
import { fbTrack } from '@/lib/fbpixel'

// ── Cart state (persisted in localStorage) ────────────────────────────────────

type CartContextValue = {
  items: string[]
  add: (id: string) => void
  remove: (id: string) => void
  clear: () => void
  has: (id: string) => boolean
}

const CartContext = createContext<CartContextValue>({
  items: [], add: () => {}, remove: () => {}, clear: () => {}, has: () => false,
})

const STORAGE_KEY = 'ag-cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: string[] = JSON.parse(raw)
        setItems(parsed.filter(id => CATALOG.some(c => c.id === id)))
      }
    } catch {}
  }, [])

  const persist = useCallback((next: string[]) => {
    setItems(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }, [])

  const add = useCallback((id: string) => {
    setItems(prev => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(x => x !== id)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const clear = useCallback(() => persist([]), [persist])
  const has = useCallback((id: string) => items.includes(id), [items])

  return (
    <CartContext.Provider value={{ items, add, remove, clear, has }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}

// ── Add to Cart button ─────────────────────────────────────────────────────────

export function AddToCartButton({ id, className }: { id: string; className?: string }) {
  const { add, has } = useCart()
  const item = getCatalogItem(id)
  if (!item) return null
  const inCart = has(id)

  function handleAdd() {
    add(id)
    fbTrack('AddToCart', {
      content_ids: [id],
      content_name: item!.name,
      content_type: 'product',
      value: item!.price,
      currency: 'USD',
    })
  }

  return (
    <button
      onClick={handleAdd}
      disabled={inCart}
      className={className || 'block w-full text-center py-2.5 rounded-xl font-bold text-sm transition-all border'}
      style={inCart
        ? { background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0', cursor: 'default' }
        : { background: 'white', color: '#2563eb', borderColor: '#bfdbfe' }}
    >
      {inCart ? '✓ In Cart' : '🛒 Add to Cart'}
    </button>
  )
}

// ── Header cart icon ───────────────────────────────────────────────────────────

export function CartButton() {
  const { items } = useCart()
  return (
    <Link
      href="/cart"
      className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
      aria-label={`Cart (${items.length} items)`}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {items.length > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
          {items.length}
        </span>
      )}
    </Link>
  )
}
