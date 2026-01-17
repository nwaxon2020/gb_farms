'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function LegalPage({ params }: { params: { type: string } }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPolicy = async () => {
      const docSnap = await getDoc(doc(db, "settings", "legal"))
      if (docSnap.exists()) {
        // Change 'terms' to 'privacy' depending on the page
        setContent(docSnap.data().terms || "Content coming soon...")
      }
      setLoading(false)
    }
    fetchPolicy()
  }, [])

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto pt-40 pb-20 px-6">
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-10 tracking-tighter">
          Terms & <span className="text-emerald-600">Conditions</span>
        </h1>
        <div className="prose prose-emerald max-w-none">
          {/* whitespace-pre-wrap preserves the CEO's formatting/line breaks */}
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
            {content}
          </p>
        </div>
      </div>
      <Footer />
    </main>
  )
}