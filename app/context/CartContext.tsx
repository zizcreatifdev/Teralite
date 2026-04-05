'use client'

import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'

export interface CartItem {
  produitId: string
  slug: string
  nom: string
  categorie: string
  prixUnitaire: number
  photoUrl: string | null
  quantite: number
}

interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD'; item: CartItem }
  | { type: 'REMOVE'; produitId: string }
  | { type: 'SET_QTE'; produitId: string; quantite: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] }

interface CartContextValue {
  items: CartItem[]
  count: number
  total: number
  ajouter: (item: CartItem) => void
  retirer: (produitId: string) => void
  setQuantite: (produitId: string, quantite: number) => void
  vider: () => void
}

const STORAGE_KEY = 'teralite_cart'

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.items }

    case 'ADD': {
      const existing = state.items.find((i) => i.produitId === action.item.produitId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.produitId === action.item.produitId
              ? { ...i, quantite: i.quantite + action.item.quantite }
              : i
          ),
        }
      }
      return { items: [...state.items, action.item] }
    }

    case 'REMOVE':
      return { items: state.items.filter((i) => i.produitId !== action.produitId) }

    case 'SET_QTE':
      if (action.quantite <= 0) {
        return { items: state.items.filter((i) => i.produitId !== action.produitId) }
      }
      return {
        items: state.items.map((i) =>
          i.produitId === action.produitId ? { ...i, quantite: action.quantite } : i
        ),
      }

    case 'CLEAR':
      return { items: [] }

    default:
      return state
  }
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] })

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const items = JSON.parse(raw) as CartItem[]
        if (Array.isArray(items)) {
          dispatch({ type: 'HYDRATE', items })
        }
      }
    } catch {
      // localStorage indisponible ou JSON corrompu
    }
  }, [])

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    } catch {
      // ignore
    }
  }, [state.items])

  const ajouter = useCallback((item: CartItem) => dispatch({ type: 'ADD', item }), [])
  const retirer = useCallback((produitId: string) => dispatch({ type: 'REMOVE', produitId }), [])
  const setQuantite = useCallback(
    (produitId: string, quantite: number) => dispatch({ type: 'SET_QTE', produitId, quantite }),
    []
  )
  const vider = useCallback(() => dispatch({ type: 'CLEAR' }), [])

  const count = state.items.reduce((s, i) => s + i.quantite, 0)
  const total = state.items.reduce((s, i) => s + i.prixUnitaire * i.quantite, 0)

  return (
    <CartContext.Provider value={{ items: state.items, count, total, ajouter, retirer, setQuantite, vider }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart doit être utilisé dans <CartProvider>')
  return ctx
}
