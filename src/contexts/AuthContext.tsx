'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

type SiteUser = {
  name: string
  phone: string
}

type AuthContextType = {
  user: SiteUser | null
  showModal: () => void
  hideModal: () => void
  modalVisible: boolean
  register: (name: string, phone: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SiteUser | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('futzone_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  function showModal() { setModalVisible(true) }
  function hideModal() { setModalVisible(false) }

  async function register(name: string, phone: string) {
    await supabase.from('registrations').upsert({ name, phone }, { onConflict: 'phone' })
    const newUser = { name, phone }
    localStorage.setItem('futzone_user', JSON.stringify(newUser))
    setUser(newUser)
    setModalVisible(false)
  }

  function logout() {
    localStorage.removeItem('futzone_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, showModal, hideModal, modalVisible, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
