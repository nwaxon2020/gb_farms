'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebaseConfig'
import { useAuthState } from 'react-firebase-hooks/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ArrowLeftIcon, ScaleIcon, ShieldCheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function PolicyManager() {
  const [user, authLoading] = useAuthState(auth)
  const [terms, setTerms] = useState('')
  const [privacy, setPrivacy] = useState('')
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const CEO_ID = process.env.NEXT_PUBLIC_ADMIN_ID

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.uid !== CEO_ID) {
        router.push('/admin')
      } else {
        fetchPolicies()
      }
    }
  }, [user, authLoading])

  const fetchPolicies = async () => {
    const docSnap = await getDoc(doc(db, "settings", "legal"))
    if (docSnap.exists()) {
      setTerms(docSnap.data().terms || '')
      setPrivacy(docSnap.data().privacy || '')
    }
  }

  const handleUpdate = async (type: 'terms' | 'privacy') => {
    setLoading(true)
    const tId = toast.loading(`Updating ${type}...`)
    try {
      await setDoc(doc(db, "settings", "legal"), {
        [type]: type === 'terms' ? terms : privacy,
        updatedAt: serverTimestamp()
      }, { merge: true })
      toast.success(`${type} updated successfully!`, { id: tId })
    } catch (e) {
      toast.error("Update failed", { id: tId })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return null

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-emerald-700 font-bold mb-6 transition-colors group">
          <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200">
            <ScaleIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Legal Policy Editor</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Master CEO Control</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Terms Editor */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <DocumentTextIcon className="w-6 h-6 text-amber-600" />
                <h2 className="text-xl font-bold text-gray-900">Terms & Conditions</h2>
              </div>
              <button 
                onClick={() => handleUpdate('terms')}
                className="bg-gray-900 text-white px-6 py-2 rounded-xl text-xs font-black hover:bg-black transition-all"
              >
                SAVE TERMS
              </button>
            </div>
            <textarea 
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full h-80 p-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Paste your Terms and Conditions here..."
            />
          </div>

          {/* Privacy Editor */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-bold text-gray-900">Privacy Policy</h2>
              </div>
              <button 
                onClick={() => handleUpdate('privacy')}
                className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all"
              >
                SAVE PRIVACY
              </button>
            </div>
            <textarea 
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              className="w-full h-80 p-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Paste your Privacy Policy here..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}