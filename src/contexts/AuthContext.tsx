'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

type SiteUser = {
  name: string
  email: string
}

type AuthContextType = {
  user: SiteUser | null
  initialized: boolean
  showModal: (view?: 'login' | 'register') => void
  hideModal: () => void
  modalVisible: boolean
  modalInitialView: 'login' | 'register'
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<void>
  loginDirect: (userObj: SiteUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SiteUser | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalInitialView, setModalInitialView] = useState<'login' | 'register'>('login')

  useEffect(() => {
    const stored = localStorage.getItem('futzone_user')
    if (stored) {
      const parsed = JSON.parse(stored)
      // Migrate old phone-based sessions
      if (parsed.phone && !parsed.email) {
        parsed.email = parsed.phone
      }
      setUser(parsed)
    }
    setInitialized(true)
  }, [])

  function showModal(view: 'login' | 'register' = 'login') {
    setModalInitialView(view)
    setModalVisible(true)
  }
  function hideModal() { setModalVisible(false) }

  async function login(email: string, password: string): Promise<boolean> {
    const { data } = await supabase
      .from('registrations')
      .select('name, email')
      .eq('email', email.trim().toLowerCase())
      .eq('password', password)
      .single()

    if (data) {
      const userObj = { name: data.name, email: data.email }
      localStorage.setItem('futzone_user', JSON.stringify(userObj))
      setUser(userObj)
      setModalVisible(false)
      return true
    }
    return false
  }

  async function register(name: string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase()

    const { data: existing } = await supabase
      .from('registrations')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existing) throw new Error('email_taken')

    const { error } = await supabase
      .from('registrations')
      .insert({ name, email: normalizedEmail, password })

    if (error) throw new Error('supabase:' + error.message)

    const refCode = localStorage.getItem('futzone_ref')
    if (refCode) {
      fetch('/api/affiliate/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_phone: normalizedEmail, user_name: name, referral_code: refCode }),
      })
    }

    const newUser = { name, email: normalizedEmail }
    localStorage.setItem('futzone_user', JSON.stringify(newUser))
    setUser(newUser)
    setModalVisible(false)
  }

  function loginDirect(userObj: SiteUser) {
    localStorage.setItem('futzone_user', JSON.stringify(userObj))
    setUser(userObj)
  }

  function logout() {
    localStorage.removeItem('futzone_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, initialized, showModal, hideModal, modalVisible, modalInitialView, login, register, loginDirect, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
