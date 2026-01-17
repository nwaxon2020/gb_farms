'use client'

import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebaseConfig'
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth'
import { FaFacebookF, FaInstagram, FaWhatsapp, FaLock, FaTiktok } from 'react-icons/fa'
import Link from 'next/link'
import toast from 'react-hot-toast'

const Footer = () => {
  const [user] = useAuthState(auth)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [error, setError] = useState('')
  
  const [contactData, setContactData] = useState({ 
    phoneNumber: '', email: 'ceo@farmfresh.com', address: '123 Green Pastures Lane, Countryside',
    boilerMessage: '', facebook: '', instagram: '', twitter: '', youtube: '', tiktok: ''
  })

  const currentYear = new Date().getFullYear()

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "contact"), (doc) => {
      if (doc.exists()) {
        setContactData(prev => ({ ...prev, ...doc.data() }))
      }
    })
    return () => unsub()
  }, [])

  const handleGoogleAuth = async () => {
    if (user) { await signOut(auth) } 
    else {
      const provider = new GoogleAuthProvider()
      try { 
        await signInWithPopup(auth, provider)
      } 
      catch (err) { console.error("Sign in error", err) }
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const tId = toast.loading("Connecting to Secure Auth...");

    try {
      // Force lowercase to match your adminStaff collection docs
      const cleanEmail = adminEmail.toLowerCase().trim();
      
      await signInWithEmailAndPassword(auth, cleanEmail, adminPassword);
      
      setIsAdminModalOpen(false);
      toast.success("Admin Access Granted", { id: tId });
      window.location.reload(); 
    } catch (err: any) {
      console.error(err.code);
      if (err.code === 'auth/account-exists-with-different-credential') {
        setError("Security Conflict: This email is already a Google user. Please use a non-Google email for Admin.");
      } else {
        setError("Access Denied: Invalid Credentials.");
      }
      toast.error("Login Failed", { id: tId });
    }
  };

  const socialLinks = [
    { icon: <FaFacebookF />, color: 'hover:bg-blue-600', href: contactData.facebook || '#', label: 'facebook' },
    { icon: <FaInstagram />, color: 'hover:bg-pink-600', href: contactData.instagram || '#', label: 'instagram' },
    { icon: <FaTiktok />, color: 'hover:bg-black', href: contactData.tiktok || '#', label: 'tiktok' },
  ]

  const whatsappUrl = contactData.phoneNumber 
    ? `https://wa.me/${contactData.phoneNumber.replace('+', '')}?text=${encodeURIComponent(contactData.boilerMessage || '')}` 
    : '#'

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white px-6 md:px-4 pt-16 pb-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg"><span className="text-white font-bold text-3xl">F</span></div>
              <div><h2 className="text-3xl font-bold font-serif">FarmFresh</h2><p className="text-green-300 text-sm font-medium">Premium Livestock Since 1995</p></div>
            </div>
            <p className="text-gray-400 mb-8 max-w-lg">Ethically-raised livestock and sustainable farming practices.</p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className={`w-10 h-10 bg-gray-800 ${social.color} rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110`}>{social.icon}</a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6 text-green-300">Quick Links</h3>
            <ul className="space-y-3">
              {[ { name: 'Home', href: '/' }, { name: 'Our Livestock', href: '/livestock' }, { name: 'About Us', href: '/about' }, { name: 'Chat Us', href: '/#chat' } ].map((item) => (
                <li key={item.name}><Link href={item.href} className="text-gray-400 hover:text-green-400 transition-colors flex items-center space-x-2"><span className="text-[10px] opacity-70">▶</span><span>{item.name}</span></Link></li>
              ))}
              <li><button onClick={handleGoogleAuth} className="text-gray-400 hover:text-green-400 transition-colors flex items-center space-x-2"><span className="text-[10px] opacity-70">▶</span><span>{user ? 'Sign Out' : 'Sign In with Google'}</span></button></li>
              {!user && (
                <li><button onClick={() => setIsAdminModalOpen(true)} className="text-gray-500 hover:text-amber-400 text-xs mt-4 flex items-center space-x-2 transition-all"><FaLock className="w-2.5 h-2.5" /><span>Admin Portal</span></button></li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6 text-green-300">Contact CEO</h3>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-start space-x-3"><span className="text-green-500">📍</span><span>{contactData.address}</span></li>
              <li className="flex items-center space-x-3"><span className="text-green-500">📞</span><a href={`tel:${contactData.phoneNumber}`} className="hover:text-white transition-colors">{contactData.phoneNumber || 'Setting up...'}</a></li>
              <li className="flex items-center space-x-3"><span className="text-green-500">✉️</span><a href={`mailto:${contactData.email}`} className="hover:text-white transition-colors">{contactData.email}</a></li>
            </ul>
            <div className="mt-8">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all space-x-2 ${!contactData.phoneNumber && 'opacity-50 cursor-not-allowed'}`}><FaWhatsapp className="w-5 h-5" /><span>Chat on WhatsApp</span></a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 my-12 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <p>© {currentYear} FarmFresh Livestock. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0"><Link href="/policy" className="hover:text-green-400">Privacy Policy</Link><Link href="/terms" className="hover:text-green-400">Terms of Service</Link></div>
        </div>
      </div>

      {isAdminModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md text-gray-900 relative">
            <button onClick={() => setIsAdminModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
            <h2 className="text-2xl font-bold mb-2">Admin Login</h2>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div><label className="text-sm font-semibold">Admin Email</label><input type="email" className="w-full p-3 border rounded-lg mt-1 focus:ring-2 focus:ring-green-500 outline-none" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required /></div>
              <div><label className="text-sm font-semibold">Password</label><input type="password" className="w-full p-3 border rounded-lg mt-1 focus:ring-2 focus:ring-green-500 outline-none" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required /></div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black transition-all">Log In as Admin</button>
            </form>
          </div>
        </div>
      )}
    </footer>
  )
}

export default Footer