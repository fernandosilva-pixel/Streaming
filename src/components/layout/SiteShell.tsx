'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import Footer from './Footer'
import AuthModal from '@/components/auth/AuthModal'
import PresenceTracker from '@/components/analytics/PresenceTracker'
import ReferralTracker from '@/components/analytics/ReferralTracker'
import PopupBanner from '@/components/common/PopupBanner'
import ScheduleNotification from '@/components/common/ScheduleNotification'
import OnboardingModals from '@/components/common/OnboardingModals'

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/compostov')

  if (isAdmin) return <>{children}</>

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
      <AuthModal />
      <PresenceTracker />
      <ReferralTracker />
      <PopupBanner />
      <ScheduleNotification />
      <OnboardingModals />
    </>
  )
}
