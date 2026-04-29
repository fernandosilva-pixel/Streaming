'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

type SiteUser = {
  name: string
  phone: string
}

type AuthContextType = {
  user: SiteUser | null
  initialized: boolean
  showModal: () => void
  hideModal: () => void
  modalVisible: boolean
  login: (phone: string, password: string) => Promise<boolean>
  register: (name: string, phone: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SiteUser | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('futzone_user')
    if (stored) setUser(JSON.parse(stored))
    setInitialized(true)
  }, [])

  function showModal() { setModalVisible(true) }
  function hideModal() { setModalVisible(false) }

  async function login(phone: string, password: string): Promise<boolean> {
    const digits = phone.replace(/\D/g, '')
    const { data } = await supabase
      .from('registrations')
      .select('name, phone')
      .eq('phone', digits)
      .eq('password', password)
      .single()

    if (data) {
      const userObj = { name: data.name, phone: data.phone }
      localStorage.setItem('futzone_user', JSON.stringify(userObj))
      setUser(userObj)
      setModalVisible(false)
      return true
    }
    return false
  }

  async function register(name: string, phone: string, password: string) {
    const digits = phone.replace(/\D/g, '')

    const { data: existing } = await supabase
      .from('registrations')
      .select('id')
      .eq('phone', digits)
      .maybeSingle()

    if (existing) throw new Error('Telefone já cadastrado. Faça login.')

    const { error } = await supabase
      .from('registrations')
      .insert({ name, phone: digits, password })

    if (error) throw new Error(error.message)

    const newUser = { name, phone: digits }
    localStorage.setItem('futzone_user', JSON.stringify(newUser))
    setUser(newUser)
    setModalVisible(false)
  }

  function logout() {
    localStorage.removeItem('futzone_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, initialized, showModal, hideModal, modalVisible, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
