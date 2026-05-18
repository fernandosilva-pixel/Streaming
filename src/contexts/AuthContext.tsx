'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export type ContentPreference = 'futebol' | 'basquete' | 'hibrido'

export type SiteUser = {
  name: string
  email: string
  plan: 'free' | 'mensal'
  plan_expires_at: string | null
  content_preference: ContentPreference
}

type AuthContextType = {
  user: SiteUser | null
  initialized: boolean
  showModal: (view?: 'login' | 'register') => void
  hideModal: () => void
  modalVisible: boolean
  modalInitialView: 'login' | 'register'
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>
  loginDirect: (userObj: { name: string; email: string }) => void
  logout: () => void
  refreshUser: () => Promise<void>
  updatePreference: (pref: ContentPreference) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function isPlanActive(user: SiteUser | null): boolean {
  if (!user || user.plan !== 'mensal') return false
  if (!user.plan_expires_at) return false
  return new Date(user.plan_expires_at) > new Date()
}

async function fetchPlanData(email: string): Promise<Pick<SiteUser, 'plan' | 'plan_expires_at' | 'content_preference'>> {
  const { data } = await supabase
    .from('registrations')
    .select('plan, plan_expires_at, content_preference')
    .eq('email', email)
    .maybeSingle()
  return {
    plan: (data?.plan as 'free' | 'mensal') ?? 'free',
    plan_expires_at: data?.plan_expires_at ?? null,
    content_preference: (data?.content_preference as ContentPreference) ?? 'hibrido',
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SiteUser | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalInitialView, setModalInitialView] = useState<'login' | 'register'>('login')

  useEffect(() => {
    const stored = localStorage.getItem('futzone_user')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.phone && !parsed.email) parsed.email = parsed.phone
        const base: SiteUser = {
          name: parsed.name,
          email: parsed.email,
          plan: parsed.plan ?? 'free',
          plan_expires_at: parsed.plan_expires_at ?? null,
          content_preference: parsed.content_preference ?? 'hibrido',
        }
        setUser(base)
        // Refresh plan data from DB in background
        fetchPlanData(base.email).then(planData => {
          const updated = { ...base, ...planData }
          setUser(updated)
          localStorage.setItem('futzone_user', JSON.stringify(updated))
        })
      } catch {}
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
      .select('name, email, plan, plan_expires_at, content_preference')
      .eq('email', email.trim().toLowerCase())
      .eq('password', password)
      .single()

    if (data) {
      const userObj: SiteUser = {
        name: data.name,
        email: data.email,
        plan: (data.plan as 'free' | 'mensal') ?? 'free',
        plan_expires_at: data.plan_expires_at ?? null,
        content_preference: (data.content_preference as ContentPreference) ?? 'hibrido',
      }
      localStorage.setItem('futzone_user', JSON.stringify(userObj))
      setUser(userObj)
      setModalVisible(false)
      return true
    }
    return false
  }

  async function register(name: string, email: string, password: string, phone?: string) {
    const normalizedEmail = email.trim().toLowerCase()

    const { data: existing } = await supabase
      .from('registrations')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existing) throw new Error('email_taken')

    const { error } = await supabase
      .from('registrations')
      .insert({ name, email: normalizedEmail, phone: phone ?? normalizedEmail, password })

    if (error) throw new Error('supabase:' + error.message)

    const refCode = localStorage.getItem('futzone_ref')
    if (refCode) {
      fetch('/api/affiliate/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_phone: normalizedEmail, user_name: name, referral_code: refCode }),
      })
    }

    const newUser: SiteUser = {
      name,
      email: normalizedEmail,
      plan: 'free',
      plan_expires_at: null,
      content_preference: 'hibrido',
    }
    localStorage.setItem('futzone_user', JSON.stringify(newUser))
    setUser(newUser)
    setModalVisible(false)
  }

  function loginDirect(userObj: { name: string; email: string }) {
    const fullUser: SiteUser = {
      name: userObj.name,
      email: userObj.email,
      plan: 'free',
      plan_expires_at: null,
      content_preference: 'hibrido',
    }
    localStorage.setItem('futzone_user', JSON.stringify(fullUser))
    setUser(fullUser)
    // Fetch plan data in background
    fetchPlanData(userObj.email).then(planData => {
      const updated = { ...fullUser, ...planData }
      setUser(updated)
      localStorage.setItem('futzone_user', JSON.stringify(updated))
    })
  }

  function logout() {
    localStorage.removeItem('futzone_user')
    setUser(null)
  }

  async function refreshUser() {
    if (!user) return
    const planData = await fetchPlanData(user.email)
    const updated = { ...user, ...planData }
    setUser(updated)
    localStorage.setItem('futzone_user', JSON.stringify(updated))
  }

  async function updatePreference(pref: ContentPreference) {
    if (!user) return
    await supabase.from('registrations').update({ content_preference: pref }).eq('email', user.email)
    const updated = { ...user, content_preference: pref }
    setUser(updated)
    localStorage.setItem('futzone_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, initialized, showModal, hideModal, modalVisible, modalInitialView, login, register, loginDirect, logout, refreshUser, updatePreference }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { isPlanActive }
