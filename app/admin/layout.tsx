'use client'

import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebaseConfig'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // If not logged in at all
      if (!user) {
        router.push('/')
        return
      }

      // If logged in but NOT via Password (Admin) and NOT the CEO
      const isAdmin = user.providerData.some(p => p.providerId === 'password')
      const isCEO = user.uid === process.env.NEXT_PUBLIC_ADMIN_ID

      if (!isAdmin && !isCEO) {
        router.push('/')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return <>{children}</>
}